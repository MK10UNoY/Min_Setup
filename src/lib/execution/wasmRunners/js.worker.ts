// src/lib/execution/wasmRunners/js.worker.ts
// Runs JS/TS entirely in-browser — no Nodebox, no server.

const TS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.4.5/typescript.min.js';

let tsLoaded = false;
let tsPromise: Promise<void> | null = null;
let tsObject: any = null;

async function ensureTypeScript() {
	if (tsLoaded) return;
	if (!tsPromise) {
		tsPromise = (async () => {
			const response = await fetch(TS_CDN);
			const code = await response.text();

			const workerGlobal = self;
			const contextModule = { exports: {} as any };
			const contextExports = contextModule.exports;

			const fn = new Function("module", "exports", "globalThis", "self", code);
			fn(contextModule, contextExports, workerGlobal, workerGlobal);

			tsObject = contextModule.exports && contextModule.exports.transpileModule
				? contextModule.exports
				: (contextModule.exports.ts || (workerGlobal as any).ts);

			if (!tsObject) {
				throw new Error("Failed to load TypeScript compiler API");
			}
			tsLoaded = true;
		})();
	}
	await tsPromise;
}

// ── ProcExit class ────────────────────────────────────────────────────────────
class ProcExit extends Error {
	code: number;
	constructor(code: number) {
		super(`process exited with code ${code}.`);
		this.code = code;
	}
}

// ── Stdin helper ──────────────────────────────────────────────────────────────
function makeStdinReader(stdinStr: string) {
	const lines = stdinStr.split('\n');
	let pos = 0;
	return () => (pos < lines.length ? lines[pos++] : null);
}

// ── Console capture ───────────────────────────────────────────────────────────
function makeConsole(stdout: string[], stderr: string[]) {
	return {
		log:   (...a: any[]) => stdout.push(a.map(String).join(' ')),
		info:  (...a: any[]) => stdout.push(a.map(String).join(' ')),
		warn:  (...a: any[]) => stderr.push('warn: ' + a.map(String).join(' ')),
		error: (...a: any[]) => stderr.push(a.map(String).join(' ')),
	};
}

// ── JS runner ─────────────────────────────────────────────────────────────────
function runJS(code: string, stdin: string): { stdout: string; stderr: string; exitCode: number } {
	const stdoutLines: string[] = [];
	const stderrLines: string[] = [];
	const readLine = makeStdinReader(stdin);
	let exitCode = 0;

	const sandbox = {
		console: makeConsole(stdoutLines, stderrLines),
		process: {
			exit: (codeNum: number) => {
				throw new ProcExit(codeNum);
			},
			argv: [],
			env: {}
		},
		prompt: () => readLine(),
		require: () => {
			throw new Error('require() not supported in browser sandbox');
		}
	};

	try {
		const keys = Object.keys(sandbox);
		const values = Object.values(sandbox);
		const fn = new Function(...keys, code);
		fn(...values);
	} catch (e: any) {
		if (e instanceof ProcExit) {
			exitCode = e.code;
		} else {
			stderrLines.push(e?.message ?? String(e));
			exitCode = 1;
		}
	}

	return {
		stdout: stdoutLines.join('\n'),
		stderr: stderrLines.join('\n'),
		exitCode
	};
}

// ── TS runner ─────────────────────────────────────────────────────────────────
async function runTS(code: string, stdin: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	await ensureTypeScript();
	const ts = tsObject;

	try {
		const transpileResult = ts.transpileModule(code, {
			compilerOptions: {
				target: ts.ScriptTarget.ES2020,
				module: ts.ModuleKind.None
			}
		});

		if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
			const errors = transpileResult.diagnostics.map((d: any) => {
				const message = typeof d.messageText === 'string'
					? d.messageText
					: d.messageText.messageText;
				return `TS${d.code}: ${message}`;
			}).join('\n');
			return { stdout: '', stderr: errors, exitCode: 1 };
		}

		return runJS(transpileResult.outputText, stdin);
	} catch (e: any) {
		return {
			stdout: '',
			stderr: `TypeScript compilation error: ${e.message ?? String(e)}`,
			exitCode: 1
		};
	}
}

// ── Worker message handler ────────────────────────────────────────────────────
self.onmessage = async (e: MessageEvent) => {
	const { id, code, lang, stdin } = e.data as {
		id: string;
		code: string;
		lang: 'js' | 'ts';
		stdin: string;
	};

	try {
		const result = lang === 'ts' ? await runTS(code, stdin) : runJS(code, stdin);
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

