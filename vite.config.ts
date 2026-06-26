import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		{
			name: 'cross-origin-isolation-headers',
			configureServer(server) {
				server.middlewares.use((_req, res, next) => {
					res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
					next();
				});
			},
			configurePreviewServer(server) {
				server.middlewares.use((_req, res, next) => {
					res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
					next();
				});
			}
		}
	],
	worker: {
		format: 'iife'
	},
	server: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Content-Security-Policy': "script-src 'self' 'unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self' blob:;"
		}
	},
	preview: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'credentialless',
			'Content-Security-Policy': "script-src 'self' 'unsafe-eval' blob:; worker-src 'self' blob:; connect-src 'self' blob:;"
		}
	}
});
