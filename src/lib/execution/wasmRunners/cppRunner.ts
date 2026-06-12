/**
 * C/C++ WASM Runner — thin wrapper that spins up a Web Worker
 * and resolves a promise when the compilation+execution completes.
 *
 * The heavy lifting (loading clang/lld WASM, compiling, linking, running)
 * happens entirely inside the worker thread to avoid blocking the UI.
 */
import CppWorker from './cpp.worker?worker';
import type { CppRunResult } from './types';

// Keep a single worker instance alive across runs (reuse loaded WASM modules)
let worker: Worker | null = null;
let idCounter = 0;
const pending = new Map<string, { resolve: (r: CppRunResult) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
	if (!worker) {
		worker = new CppWorker();
		worker.onmessage = (e: MessageEvent) => {
			const { id, stdout, stderr, exitCode } = e.data;
			const entry = pending.get(id);
			if (entry) {
				entry.resolve({ stdout, stderr, exitCode });
				pending.delete(id);
			}
		};
		worker.onerror = (e) => {
			// Reject all pending on fatal worker crash
			for (const [id, entry] of pending) {
				entry.resolve({
					stdout: '',
					stderr: `Worker crashed: ${e.message}`,
					exitCode: 1
				});
				pending.delete(id);
			}
			worker = null; // allow recreation next run
		};
	}
	return worker;
}

/**
 * Run C or C++ code in-browser via WASM clang/lld.
 * Returns { stdout, stderr, exitCode } matching the existing execution shape.
 */
export function runCpp(code: string, lang: 'c' | 'cpp' = 'cpp'): Promise<CppRunResult> {
	return new Promise((resolve, reject) => {
		const id = String(++idCounter);
		pending.set(id, { resolve, reject });
		getWorker().postMessage({ id, code, lang });
	});
}

/** Destroy the worker and release WASM memory */
export function cleanupCppRunner(): void {
	if (worker) {
		worker.terminate();
		worker = null;
	}
	pending.clear();
}
