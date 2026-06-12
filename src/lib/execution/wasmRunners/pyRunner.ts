// src/lib/execution/wasmRunners/pyRunner.ts
// Coordinates the Pyodide Web Worker.

import PyWorker from './py.worker?worker';
import type { CppRunResult } from './types';

let worker: Worker | null = null;
let idCounter = 0;
const pending = new Map<string, { resolve: (r: CppRunResult) => void }>();

function getWorker(): Worker {
	if (!worker) {
		worker = new PyWorker();
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

export function runPython(code: string, stdin = ''): Promise<CppRunResult> {
	return new Promise((resolve) => {
		const id = String(++idCounter);
		pending.set(id, { resolve });
		getWorker().postMessage({ id, code, stdin });
	});
}

export function cleanupPyRunner(): void {
	if (worker) {
		worker.terminate();
		worker = null;
	}
	pending.clear();
}
