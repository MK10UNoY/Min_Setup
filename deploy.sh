#!/usr/bin/env bash
# ============================================================
# Low Setup Guru — Production Deployment Script
# ============================================================
# Deploys Judge0 CE on a fresh Ubuntu 22.04 VPS with:
#   - Docker & Docker Compose
#   - Nginx reverse proxy
#   - Let's Encrypt SSL via Certbot
#   - Basic auth for Judge0 API
#   - UFW firewall
#   - Systemd service for auto-restart
#
# USAGE:
#   1. Get a $6/month VPS (DigitalOcean, Hetzner, etc.)
#   2. SSH into the VPS as root
#   3. Upload this script: scp deploy.sh root@your-vps-ip:~/
#   4. Run: chmod +x deploy.sh && ./deploy.sh
#
# BEFORE RUNNING:
#   Set these variables below:
DOMAIN="judge.yourdomain.com"    # Your Judge0 subdomain
EMAIL="your-email@example.com"   # For Let's Encrypt SSL
AUTH_USER="judge0"               # Basic auth username
AUTH_PASS="change-this-password" # Basic auth password
# ============================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Pre-flight Checks ──────────────────────────────────────

if [ "$EUID" -ne 0 ]; then
    err "Please run as root: sudo ./deploy.sh"
fi

if [ "$DOMAIN" = "judge.yourdomain.com" ]; then
    err "Please edit this script and set DOMAIN, EMAIL, AUTH_USER, AUTH_PASS"
fi

log "Starting deployment for ${DOMAIN}..."

# ─── Step 1: System Update ──────────────────────────────────

log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git htop ufw nginx certbot python3-certbot-nginx apache2-utils

# ─── Step 2: Install Docker ─────────────────────────────────

if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker installed successfully"
else
    log "Docker already installed"
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    log "Installing Docker Compose plugin..."
    apt-get install -y -qq docker-compose-plugin
fi

# ─── Step 3: Set Up Judge0 ──────────────────────────────────

JUDGE0_DIR="/opt/judge0"
log "Setting up Judge0 in ${JUDGE0_DIR}..."

mkdir -p "${JUDGE0_DIR}"

# Generate a random secret key
SECRET_KEY=$(openssl rand -hex 32)

# Create docker-compose.yml for production
cat > "${JUDGE0_DIR}/docker-compose.yml" << 'COMPOSE_EOF'
x-judge0-env: &judge0-env
  POSTGRES_HOST: db
  POSTGRES_PORT: 5432
  POSTGRES_USER: judge0
  POSTGRES_PASSWORD: POSTGRES_PASS_PLACEHOLDER
  POSTGRES_DB: judge0
  REDIS_HOST: redis
  REDIS_PORT: 6379
  REDIS_PASSWORD: ""
  RAILS_ENV: production
  RAILS_MAX_THREADS: 10
  SECRET_KEY_BASE: SECRET_KEY_PLACEHOLDER
  MAX_QUEUE_SIZE: 200
  MAX_CPU_TIME_LIMIT: 10
  MAX_CPU_EXTRA_TIME: 5
  MAX_WALL_TIME_LIMIT: 20
  MAX_MEMORY_LIMIT: 256000
  MAX_STACK_LIMIT: 128000
  MAX_PROCESSES_AND_OR_THREADS: 60
  MAX_FILE_SIZE: 1024
  ALLOW_ORIGIN: "*"
  AUTHN_HEADER: X-Auth-Token
  AUTHN_TOKEN: AUTH_TOKEN_PLACEHOLDER
  INTERVAL: 0.1
  COUNT: 4

services:
  server:
    image: judge0/judge0:1.13.1
    ports:
      - "127.0.0.1:2358:2358"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      <<: *judge0-env
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:2358/about"]
      interval: 10s
      timeout: 5s
      retries: 20
      start_period: 30s

  workers:
    image: judge0/judge0:1.13.1
    command: ["./scripts/workers"]
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      <<: *judge0-env
    privileged: true
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: judge0
      POSTGRES_PASSWORD: POSTGRES_PASS_PLACEHOLDER
      POSTGRES_DB: judge0
    volumes:
      - judge0-db:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U judge0"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - judge0-redis:/data
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  judge0-db:
  judge0-redis:
COMPOSE_EOF

# Replace placeholders with actual values
PG_PASS=$(openssl rand -hex 16)
AUTH_TOKEN=$(openssl rand -hex 32)

sed -i "s/POSTGRES_PASS_PLACEHOLDER/${PG_PASS}/g" "${JUDGE0_DIR}/docker-compose.yml"
sed -i "s/SECRET_KEY_PLACEHOLDER/${SECRET_KEY}/g" "${JUDGE0_DIR}/docker-compose.yml"
sed -i "s/AUTH_TOKEN_PLACEHOLDER/${AUTH_TOKEN}/g" "${JUDGE0_DIR}/docker-compose.yml"

# Save the auth token for the user
echo "${AUTH_TOKEN}" > "${JUDGE0_DIR}/.auth-token"
chmod 600 "${JUDGE0_DIR}/.auth-token"

log "Judge0 configured. Auth token saved to ${JUDGE0_DIR}/.auth-token"

# ─── Step 4: Start Judge0 ───────────────────────────────────

log "Starting Judge0 containers..."
cd "${JUDGE0_DIR}"
docker compose pull
docker compose up -d

log "Waiting for Judge0 to initialize (this takes 2-3 minutes)..."
sleep 30

# Wait for health check
for i in $(seq 1 30); do
    if curl -sf http://localhost:2358/about > /dev/null 2>&1; then
        log "Judge0 is healthy!"
        break
    fi
    if [ "$i" -eq 30 ]; then
        warn "Judge0 not ready yet. Check: docker compose logs -f"
    fi
    sleep 5
done

# ─── Step 5: Set Up Nginx ───────────────────────────────────

log "Configuring Nginx reverse proxy for ${DOMAIN}..."

# Create basic auth file
htpasswd -cb /etc/nginx/.htpasswd "${AUTH_USER}" "${AUTH_PASS}"

# Create Nginx config
cat > "/etc/nginx/sites-available/${DOMAIN}" << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Basic auth for all requests
    auth_basic "Judge0 API";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # Allow health checks without auth
    location = /about {
        auth_basic off;
        proxy_pass http://127.0.0.1:2358;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:2358;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts for long-running submissions
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, X-Auth-Token" always;

        if (\$request_method = OPTIONS) {
            return 204;
        }
    }
}
NGINX_EOF

# Enable the site
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/"
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t || err "Nginx config test failed"
systemctl reload nginx

log "Nginx configured"

# ─── Step 6: SSL via Certbot ────────────────────────────────

log "Obtaining SSL certificate for ${DOMAIN}..."
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email "${EMAIL}" --redirect

log "SSL certificate installed"

# ─── Step 7: Firewall ───────────────────────────────────────

log "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

log "Firewall configured (SSH + HTTP/HTTPS only)"

# ─── Step 8: Systemd Service ────────────────────────────────

log "Creating systemd service for auto-restart..."

cat > /etc/systemd/system/judge0.service << SERVICE_EOF
[Unit]
Description=Judge0 CE Code Execution Engine
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${JUDGE0_DIR}
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable judge0.service

log "Systemd service created — Judge0 will auto-start on reboot"

# ─── Step 9: Auto-renew SSL ─────────────────────────────────

# Certbot auto-renew is already set up via systemd timer
systemctl enable certbot.timer

# ─── Done! ───────────────────────────────────────────────────

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "  Judge0 URL:    https://${DOMAIN}"
echo "  Auth User:     ${AUTH_USER}"
echo "  Auth Password: ${AUTH_PASS}"
echo "  Auth Token:    ${AUTH_TOKEN}"
echo ""
echo "  Test it:"
echo "    curl https://${DOMAIN}/about"
echo ""
echo "  In your Low Setup Guru .env:"
echo "    JUDGE0_URL=https://${DOMAIN}"
echo "    JUDGE0_TOKEN=${AUTH_TOKEN}"
echo "    RATE_LIMIT_ENABLED=true"
echo ""
echo "  Useful commands:"
echo "    docker compose -f ${JUDGE0_DIR}/docker-compose.yml logs -f"
echo "    docker compose -f ${JUDGE0_DIR}/docker-compose.yml restart"
echo "    systemctl status judge0"
echo ""
