// src/lib/execution/wasmRunners/jsRunner.ts
import { browser } from '$app/environment';
import type { CppRunResult } from './types';

let worker: Worker | null = null;
let idCounter = 0;
const pending = new Map<string, { resolve: (r: CppRunResult) => void }>();

function getWorker(): Worker | null {
	if (!browser) return null;
	if (!worker) {
		worker = new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'classic' });
		worker.onmessage = (e: MessageEvent) => {
			const { id, stdout, stderr, exitCode } = e.data;
			const entry = pending.get(id);
			if (entry) {
				entry.resolve({ stdout, stderr, exitCode });
				pending.delete(id);
			}
		};
		worker.onerror = (e) => {
			const msg = (e as ErrorEvent).message || 'Failed to load or execute worker script (check console / CORS / CSP / path)';
			for (const [id, entry] of pending) {
				entry.resolve({ stdout: '', stderr: `Worker crashed: ${msg}`, exitCode: 1 });
				pending.delete(id);
			}
			worker = null;
		};
	}
	return worker;
}

export function runJS(code: string, lang: 'js' | 'ts' = 'js', stdin = ''): Promise<CppRunResult> {
	return new Promise((resolve) => {
		const activeWorker = getWorker();
		if (!activeWorker) {
			return resolve({
				stdout: '',
				stderr: 'Cannot run code on the server.',
				exitCode: 1
			});
		}
		const id = String(++idCounter);
		pending.set(id, { resolve });
		activeWorker.postMessage({ id, code, lang, stdin });
	});
}

export function cleanupJsRunner(): void {
	if (worker) {
		worker.terminate();
		worker = null;
	}
	pending.clear();
}
