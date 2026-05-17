/**
 * Server-side configuration — centralized environment variable access.
 * This module can ONLY be imported in server-side code (+server.ts, hooks).
 * SvelteKit enforces this at build time via $env/dynamic/private.
 */
import { env } from '$env/dynamic/private';

/** Judge0 API base URL (no trailing slash) */
export const JUDGE0_URL: string = env.JUDGE0_URL || 'http://localhost:2358';

/** Judge0 authentication token (empty = no auth, used for production) */
export const JUDGE0_TOKEN: string = env.JUDGE0_TOKEN || '';

/** Whether server-side rate limiting is enabled */
export const RATE_LIMIT_ENABLED: boolean = env.RATE_LIMIT_ENABLED === 'true';
