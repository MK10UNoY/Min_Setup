// src/lib/execution/wasmRunners/jsRunner.ts
// Mirrors cppRunner.ts — same singleton worker pattern.

import JsWorker from './js.worker?worker';
import type { CppRunResult } from './types'; // reuse same shape

let worker: Worker | null = null;
let idCounter = 0;
const pending = new Map<string, { resolve: (r: CppRunResult) => void }>();

function getWorker(): Worker {
	if (!worker) {
		worker = new JsWorker();
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
		const id = String(++idCounter);
		pending.set(id, { resolve });
		getWorker().postMessage({ id, code, lang, stdin });
	});
}

export function cleanupJsRunner(): void {
	if (worker) {
		worker.terminate();
		worker = null;
	}
	pending.clear();
}
