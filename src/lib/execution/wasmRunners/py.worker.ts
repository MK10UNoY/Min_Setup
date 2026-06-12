// src/lib/execution/wasmRunners/py.worker.ts
// Runs Python entirely in-browser using Pyodide.

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/';

let pyodideLoaded = false;
let pyodidePromise: Promise<void> | null = null;
let pyodideInstance: any = null;

let currentStdout: ((s: string) => void) | null = null;
let currentStderr: ((s: string) => void) | null = null;
let currentStdin: (() => string | undefined) | null = null;

// Stdin reader
function makeStdinReader(stdinStr: string) {
	const lines = stdinStr.split('\n');
	let pos = 0;
	return () => (pos < lines.length ? lines[pos++] : null);
}

async function ensurePyodide() {
	if (pyodideLoaded) return;
	if (!pyodidePromise) {
		pyodidePromise = (async () => {
			const response = await fetch(PYODIDE_CDN);
			const code = await response.text();

			const workerGlobal = self;
			const contextModule = { exports: {} as any };
			const contextExports = contextModule.exports;

			const fn = new Function("module", "exports", "globalThis", "self", code);
			fn(contextModule, contextExports, workerGlobal, workerGlobal);

			const loadPyodideFn = (workerGlobal as any).loadPyodide;
			if (!loadPyodideFn) {
				throw new Error("Failed to load loadPyodide function from CDN");
			}

			pyodideInstance = await loadPyodideFn({
				indexURL: INDEX_URL,
				stdout: (text: string) => {
					if (currentStdout) currentStdout(text);
				},
				stderr: (text: string) => {
					if (currentStderr) currentStderr(text);
				},
				stdin: () => {
					if (currentStdin) {
						return currentStdin();
					}
					return undefined;
				}
			});

			pyodideLoaded = true;
		})();
	}
	await pyodidePromise;
}

async function runPython(code: string, stdin: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const stdoutLines: string[] = [];
	const stderrLines: string[] = [];
	const readLine = makeStdinReader(stdin);
	let exitCode = 0;

	// Set active delegates for this execution run
	currentStdout = (text) => stdoutLines.push(text);
	currentStderr = (text) => stderrLines.push(text);
	currentStdin = () => {
		const line = readLine();
		return line !== null ? line : undefined;
	};

	try {
		await ensurePyodide();
		await pyodideInstance.runPythonAsync(code);
	} catch (e: any) {
		stderrLines.push(e?.message ?? String(e));
		exitCode = 1;
	} finally {
		// Clean delegates
		currentStdout = null;
		currentStderr = null;
		currentStdin = null;
	}

	return {
		stdout: stdoutLines.join('\n'),
		stderr: stderrLines.join('\n'),
		exitCode
	};
}

self.onmessage = async (e: MessageEvent) => {
	const { id, code, stdin } = e.data as {
		id: string;
		code: string;
		stdin: string;
	};

	try {
		const result = await runPython(code, stdin);
		(self as any).postMessage({ id, ...result });
	} catch (err: any) {
		(self as any).postMessage({
			id,
			stdout: '',
			stderr: err?.message ?? String(err),
			exitCode: 1
		});
	}
};

export {};
