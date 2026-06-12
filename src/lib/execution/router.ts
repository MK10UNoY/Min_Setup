/**
 * Frontend execution router — single entry point for all code execution.
 * Routes to the correct backend based on language mode:
 *   - "judge0"  → POST /api/execute (server proxy)
 *   - "nodebox" → NodeboxRunner (in-browser, no server)
 *   - "wasm"    → In-browser C/C++ via WASM clang/lld (no server)
 *   - "iframe"  → returns { mode: "iframe" } for frontend rendering
 *
 * Also orchestrates terminal + execution store updates.
 */
import type { LanguageInfo, ExecuteResponse } from './types';
import { NodeboxRunner } from './nodeboxRunner';
import { runCpp, cleanupCppRunner } from './wasmRunners/cppRunner';
import { runJS, cleanupJsRunner } from './wasmRunners/jsRunner';
import { runPython, cleanupPyRunner } from './wasmRunners/pyRunner';
import { cleanOutput } from '$lib/utils/ansiStripper';
import { executionStore } from '$lib/stores/executionStore';
import { terminalStore } from '$lib/stores/terminalStore';

// ─── Nodebox Singleton ──────────────────────────────────────

const nodeboxRunner = new NodeboxRunner();

// ─── Language Cache ─────────────────────────────────────────

let languageCache: LanguageInfo[] | null = null;

/** Fetch and cache the language list from the API */
async function fetchLanguages(): Promise<LanguageInfo[]> {
	if (languageCache) return languageCache;
	const res = await fetch('/api/languages');
	if (!res.ok) throw new Error('Failed to fetch language list');
	languageCache = (await res.json()) as LanguageInfo[];
	return languageCache;
}

/** Find a language by its ID */
export async function getLanguageById(id: number): Promise<LanguageInfo | undefined> {
	const langs = await fetchLanguages();
	return langs.find((l) => l.id === id);
}

/** Find the best language match for a file extension */
export async function getLanguageByExtension(ext: string): Promise<LanguageInfo | undefined> {
	const langs = await fetchLanguages();
	const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
	return langs.find((l) => l.extension === cleanExt);
}

/** Get the language ID for a filename (resolves extension → language) */
export function getLanguageIdFromFilename(filename: string): number {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	const EXTENSION_MAP: Record<string, number> = {
		js: 63, mjs: 63, cjs: 63,
		ts: 74, tsx: 74,
		py: 71,
		c: 50, h: 50,
		cpp: 54, cc: 54, hpp: 54,
		java: 62,
		go: 60,
		rs: 73,
		rb: 72,
		php: 68,
		sh: 46,
		lua: 64,
		cs: 51,
		kt: 78,
		r: 80,
		scala: 81,
		sql: 82,
		swift: 83,
		pl: 85,
		html: -1, htm: -1,
		css: -1
	};
	return EXTENSION_MAP[ext] ?? -1;
}

/** Get the execution mode for a filename */
export function getExecutionMode(filename: string): 'judge0' | 'nodebox' | 'wasm' | 'iframe' | 'none' {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	const NODEBOX_EXTS = new Set(['js', 'mjs', 'cjs', 'ts', 'tsx']);
	const WASM_EXTS = new Set(['c', 'h', 'cpp', 'cc', 'hpp', 'py']);
	const IFRAME_EXTS = new Set(['html', 'htm', 'css']);
	const JUDGE0_EXTS = new Set([
		'java', 'go', 'rs', 'rb',
		'php', 'sh', 'lua', 'cs', 'kt', 'r', 'scala', 'sql', 'swift', 'pl'
	]);

	if (NODEBOX_EXTS.has(ext)) return 'nodebox';
	if (WASM_EXTS.has(ext)) return 'wasm';
	if (IFRAME_EXTS.has(ext)) return 'iframe';
	if (JUDGE0_EXTS.has(ext)) return 'judge0';
	return 'none';
}

// ─── Execute via Judge0 API ─────────────────────────────────

async function executeViaJudge0(
	code: string,
	languageId: number,
	stdin: string
): Promise<ExecuteResponse> {
	const response = await fetch('/api/execute', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			source_code: code,
			language_id: languageId,
			stdin
		})
	});

	const data = (await response.json()) as ExecuteResponse & { error?: string };

	if (!response.ok) {
		return {
			success: false,
			stdout: '',
			stderr: data.error ?? `Server error (${response.status})`,
			compile_output: '',
			status: { id: -1, description: 'Error' },
			time: '0s',
			memory: '0 KB',
			executionMode: 'judge0'
		};
	}

	return data;
}

// ─── Execute via JS/TS (in-browser) ─────────────────────────

async function executeViaJS(
	code: string,
	filename: string,
	stdin: string = ''
): Promise<ExecuteResponse> {
	const ext = filename.split('.').pop()?.toLowerCase() ?? 'js';
	const lang: 'js' | 'ts' = (ext === 'ts' || ext === 'tsx') ? 'ts' : 'js';
	const startTime = performance.now();

	const result = await runJS(code, lang, stdin);

	const elapsed = performance.now() - startTime;
	const timeStr = elapsed < 1000 ? `${Math.round(elapsed)}ms` : `${(elapsed / 1000).toFixed(3)}s`;

	return {
		success: result.exitCode === 0,
		stdout: result.stdout,
		stderr: result.stderr,
		compile_output: '',
		status: {
			id: result.exitCode === 0 ? 3 : 1,
			description: result.exitCode === 0 ? 'Accepted' : 'Runtime Error'
		},
		time: timeStr,
		memory: '0 KB',
		executionMode: 'nodebox' // keep same label so UI doesn't break
	};
}

// ─── Execute via WASM (C/C++ in-browser) ────────────────────

async function executeViaWasm(
	code: string,
	filename: string,
	stdin: string = ''
): Promise<ExecuteResponse> {
	const ext = filename.split('.').pop()?.toLowerCase() ?? 'cpp';
	const startTime = performance.now();

	let result: { stdout: string; stderr: string; exitCode: number };
	if (ext === 'py') {
		result = await runPython(code, stdin);
	} else {
		const lang: 'c' | 'cpp' = (ext === 'c' || ext === 'h') ? 'c' : 'cpp';
		result = await runCpp(code, lang, stdin);
	}

	const elapsed = performance.now() - startTime;
	const timeStr = elapsed < 1000
		? `${Math.round(elapsed)}ms`
		: `${(elapsed / 1000).toFixed(3)}s`;

	return {
		success: result.exitCode === 0,
		stdout: result.stdout,
		stderr: result.stderr,
		compile_output: '',
		status: {
			id: result.exitCode === 0 ? 3 : 1,
			description: result.exitCode === 0 ? 'Accepted' : 'Compilation/Runtime Error'
		},
		time: timeStr,
		memory: '0 KB',
		executionMode: 'wasm'
	};
}

// ─── Main Execution Entry Point ─────────────────────────────

/**
 * Execute code — routes to the correct backend and updates stores.
 * This is THE function that all UI components should call.
 */
export async function executeCode(
	code: string,
	filename: string,
	stdin: string = ''
): Promise<ExecuteResponse> {
	const mode = getExecutionMode(filename);
	const languageId = getLanguageIdFromFilename(filename);

	// Handle iframe mode — frontend handles this directly
	if (mode === 'iframe') {
		const result: ExecuteResponse = {
			success: true,
			stdout: '',
			stderr: '',
			compile_output: '',
			status: { id: 0, description: 'Preview Mode' },
			time: '0s',
			memory: '0 KB',
			executionMode: 'iframe'
		};
		return result;
	}

	// Handle unsupported
	if (mode === 'none') {
		const errorMsg = `No execution engine for: ${filename}`;
		executionStore.setError(errorMsg, 'unknown');
		terminalStore.appendLine(errorMsg, 'stderr');
		return {
			success: false,
			stdout: '',
			stderr: errorMsg,
			compile_output: '',
			status: { id: -1, description: 'Unsupported' },
			time: '0s',
			memory: '0 KB',
			executionMode: 'judge0'
		};
	}

	// Start execution
	const langLabel = filename.split('.').pop()?.toUpperCase() ?? 'CODE';
	executionStore.startExecution(langLabel);
	terminalStore.clear();
	terminalStore.systemMessage(`▶ Running ${filename} via ${mode}...`);
	terminalStore.setActiveTab('output');

	try {
		let result: ExecuteResponse;

		if (mode === 'wasm') {
			result = await executeViaWasm(code, filename, stdin);
		} else if (mode === 'nodebox') {
			result = await executeViaJS(code, filename, stdin);
		} else {
			result = await executeViaJudge0(code, languageId, stdin);
		}

		// Push output to terminal
		if (result.stdout) {
			terminalStore.appendLines(result.stdout, 'stdout');
		}
		if (result.stderr) {
			terminalStore.appendLines(result.stderr, 'stderr');
		}
		if (result.compile_output && result.status.id === 6) {
			terminalStore.appendLine('── Compile Output ──', 'system');
			terminalStore.appendLines(result.compile_output, 'stderr');
		}

		// Status footer
		const memStr = result.memory !== '0 KB' ? ` | Memory: ${result.memory}` : '';
		const icon = result.success ? '✓' : '✗';
		terminalStore.systemMessage(
			`\n${icon} ${result.status.description} (${result.time}${memStr})`
		);

		// Update execution store
		const timeMs = parseFloat(result.time) * (result.time.endsWith('ms') ? 1 : 1000);
		executionStore.completeExecution({
			stdout: result.stdout,
			stderr: result.stderr,
			exitCode: result.success ? 0 : 1,
			executionTime: isNaN(timeMs) ? 0 : Math.round(timeMs),
			memoryUsage: result.memory,
			language: langLabel
		});

		return result;
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		executionStore.setError(message, langLabel);
		terminalStore.appendLine(message, 'stderr');
		return {
			success: false,
			stdout: '',
			stderr: message,
			compile_output: '',
			status: { id: -1, description: 'Error' },
			time: '0s',
			memory: '0 KB',
			executionMode: mode === 'wasm' ? 'wasm' : mode === 'nodebox' ? 'nodebox' : 'judge0'
		};
	}
}

/** Cleanup all runners (call on component destroy) */
export function cleanupRunners(): void {
	nodeboxRunner.cleanup?.();
	cleanupCppRunner();
	cleanupJsRunner();
	cleanupPyRunner();
}
