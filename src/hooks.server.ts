/**
 * Server hooks — sets COOP/COEP headers for cross-origin isolation.
 * Required for SharedArrayBuffer and potentially for some execution runtimes.
 */
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	return response;
};