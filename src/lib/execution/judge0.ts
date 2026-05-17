/**
 * Judge0 server-side client — all communication with Judge0 lives here.
 * This module can ONLY be imported in server-side code.
 */
import { JUDGE0_URL, JUDGE0_TOKEN } from '$lib/config';

// ─── ANSI Stripping ─────────────────────────────────────────

const ANSI_REGEX =
	/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g;

/** Strip ANSI escape codes from terminal output */
export function stripAnsi(text: string | null | undefined): string {
	if (!text) return '';
	return text.replace(ANSI_REGEX, '');
}

// ─── Formatting Helpers ─────────────────────────────────────

/** Convert kilobytes to human-readable string (e.g. "3.4 MB") */
export function normalizeMemory(kb: number | null | undefined): string {
	if (!kb || kb <= 0) return '0 KB';
	if (kb < 1024) return `${kb} KB`;
	return `${(kb / 1024).toFixed(1)} MB`;
}

/** Format seconds string to readable (e.g. "0.123s") */
export function normalizeTime(seconds: string | null | undefined): string {
	if (!seconds) return '0s';
	const num = parseFloat(seconds);
	if (isNaN(num)) return '0s';
	return `${num.toFixed(3)}s`;
}

// ─── Judge0 Status Descriptions ─────────────────────────────

const STATUS_DESCRIPTIONS: Record<number, string> = {
	1: 'In Queue',
	2: 'Processing',
	3: 'Accepted',
	4: 'Wrong Answer',
	5: 'Time Limit Exceeded',
	6: 'Compilation Error',
	7: 'Runtime Error (SIGSEGV)',
	8: 'Runtime Error (SIGXFSZ)',
	9: 'Runtime Error (SIGFPE)',
	10: 'Runtime Error (SIGABRT)',
	11: 'Runtime Error (NZEC)',
	12: 'Runtime Error (Other)',
	13: 'Internal Error',
	14: 'Exec Format Error'
};

/** Get human-readable status description */
export function getStatusDescription(statusId: number): string {
	return STATUS_DESCRIPTIONS[statusId] ?? `Unknown Status (${statusId})`;
}

// ─── Auth Headers ───────────────────────────────────────────

/** Build authorization headers for Judge0 requests */
export function buildHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (JUDGE0_TOKEN) {
		headers['X-Auth-Token'] = JUDGE0_TOKEN;
	}
	return headers;
}

// ─── Judge0 Response Types ──────────────────────────────────

interface Judge0Status {
	id: number;
	description: string;
}

interface Judge0Submission {
	token?: string;
	stdout: string | null;
	stderr: string | null;
	compile_output: string | null;
	status: Judge0Status;
	time: string | null;
	memory: number | null;
	exit_code: number | null;
	message: string | null;
}

// ─── Normalized Result ──────────────────────────────────────

export interface Judge0Result {
	success: boolean;
	stdout: string;
	stderr: string;
	compile_output: string;
	status: {
		id: number;
		description: string;
	};
	time: string;
	memory: string;
	executionMode: 'judge0';
}

// ─── Core API Functions ─────────────────────────────────────

/**
 * Create a Judge0 submission and return the token.
 * Uses async mode (no wait).
 */
export async function createSubmission(
	sourceCode: string,
	languageId: number,
	stdin: string
): Promise<string> {
	const url = `${JUDGE0_URL}/submissions?base64_encoded=false`;
	const response = await fetch(url, {
		method: 'POST',
		headers: buildHeaders(),
		body: JSON.stringify({
			source_code: sourceCode,
			language_id: languageId,
			stdin: stdin || ''
		}),
		signal: AbortSignal.timeout(10000)
	});

	if (!response.ok) {
		const text = await response.text().catch(() => 'Unknown error');
		throw new Error(`Judge0 submission failed (${response.status}): ${text}`);
	}

	const data = (await response.json()) as { token: string };
	return data.token;
}

/**
 * Fetch a submission result by token.
 */
export async function getSubmission(token: string): Promise<Judge0Submission> {
	const fields = 'stdout,stderr,compile_output,status,time,memory,exit_code,message';
	const url = `${JUDGE0_URL}/submissions/${token}?base64_encoded=false&fields=${fields}`;

	const response = await fetch(url, {
		headers: buildHeaders(),
		signal: AbortSignal.timeout(10000)
	});

	if (!response.ok) {
		const text = await response.text().catch(() => 'Unknown error');
		throw new Error(`Judge0 fetch failed (${response.status}): ${text}`);
	}

	return (await response.json()) as Judge0Submission;
}

/**
 * Submit code and wait synchronously for the result.
 * Uses Judge0's ?wait=true mode for simplicity.
 * Returns a fully normalized, ANSI-stripped result.
 */
export async function submitAndWait(
	sourceCode: string,
	languageId: number,
	stdin: string
): Promise<Judge0Result> {
	const url =
		`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true` +
		`&fields=stdout,stderr,compile_output,status,time,memory,exit_code,message`;

	const response = await fetch(url, {
		method: 'POST',
		headers: buildHeaders(),
		body: JSON.stringify({
			source_code: sourceCode,
			language_id: languageId,
			stdin: stdin || ''
		}),
		signal: AbortSignal.timeout(15000)
	});

	if (!response.ok) {
		const text = await response.text().catch(() => 'Unknown error');
		throw new Error(`Judge0 error (${response.status}): ${text}`);
	}

	const data = (await response.json()) as Judge0Submission;
	return normalizeSubmission(data);
}

/**
 * Normalize a raw Judge0 submission into a clean result.
 * Strips ANSI codes, formats time/memory, resolves status.
 */
function normalizeSubmission(data: Judge0Submission): Judge0Result {
	const statusId = data.status?.id ?? 13;
	const isSuccess = statusId === 3 || statusId === 4;

	let stdout = stripAnsi(data.stdout);
	let stderr = stripAnsi(data.stderr);
	let compileOutput = stripAnsi(data.compile_output);

	// For compilation errors (status 6), move compile_output to stderr
	if (statusId === 6 && compileOutput && !stderr) {
		stderr = compileOutput;
	}

	// For runtime errors (7-12), ensure stderr has useful info
	if (statusId >= 7 && statusId <= 12 && !stderr) {
		stderr = data.message ? stripAnsi(data.message) : getStatusDescription(statusId);
	}

	// For TLE (status 5)
	if (statusId === 5 && !stderr) {
		stderr = 'Time Limit Exceeded — your program took too long to execute.';
	}

	return {
		success: isSuccess,
		stdout,
		stderr,
		compile_output: compileOutput,
		status: {
			id: statusId,
			description: getStatusDescription(statusId)
		},
		time: normalizeTime(data.time),
		memory: normalizeMemory(data.memory),
		executionMode: 'judge0'
	};
}
