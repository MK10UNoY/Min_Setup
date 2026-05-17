/**
 * POST /api/execute — proxy to Judge0 for compiled language execution.
 *
 * Request:
 *   { source_code: string, language_id: number, stdin?: string }
 *
 * Response (always normalized):
 *   { success, stdout, stderr, compile_output, status, time, memory, executionMode }
 *
 * Error responses:
 *   400 — invalid input (bad language, input too large)
 *   503 — Judge0 unreachable
 *   504 — execution timed out
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitAndWait } from '$lib/execution/judge0';
import { _ALLOWED_LANGUAGE_IDS } from '../languages/+server';

// ─── Constants ──────────────────────────────────────────────

const MAX_SOURCE_CODE_LENGTH = 10000;
const MAX_STDIN_LENGTH = 2000;

// ─── Input Validation ───────────────────────────────────────

interface ValidatedInput {
	source_code: string;
	language_id: number;
	stdin: string;
}

/**
 * Validate the incoming request body strictly.
 * Returns either validated data or an error string.
 */
function validateInput(body: unknown): { data?: ValidatedInput; error?: string } {
	if (!body || typeof body !== 'object') {
		return { error: 'Request body must be a JSON object' };
	}

	const { source_code, language_id, stdin } = body as Record<string, unknown>;

	// Validate source_code
	if (typeof source_code !== 'string' || source_code.trim().length === 0) {
		return { error: 'source_code is required and must be a non-empty string' };
	}
	if (source_code.length > MAX_SOURCE_CODE_LENGTH) {
		return { error: 'Input exceeds size limit' };
	}

	// Validate language_id
	if (typeof language_id !== 'number' || !Number.isInteger(language_id)) {
		return { error: 'language_id must be an integer' };
	}
	if (!_ALLOWED_LANGUAGE_IDS.has(language_id)) {
		return { error: 'Language not supported' };
	}

	// Validate stdin (optional)
	const stdinStr = typeof stdin === 'string' ? stdin : '';
	if (stdinStr.length > MAX_STDIN_LENGTH) {
		return { error: 'Input exceeds size limit' };
	}

	return {
		data: {
			source_code: source_code,
			language_id: language_id,
			stdin: stdinStr
		}
	};
}

// ─── POST Handler ───────────────────────────────────────────

/** Handle code execution requests — validate, proxy to Judge0, return normalized result */
export const POST: RequestHandler = async ({ request }) => {
	// Parse JSON body
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON in request body' }, { status: 400 });
	}

	// Validate input
	const validation = validateInput(body);
	if (validation.error) {
		return json({ error: validation.error }, { status: 400 });
	}
	const { source_code, language_id, stdin } = validation.data!;

	// Execute via Judge0
	try {
		const result = await submitAndWait(source_code, language_id, stdin);
		return json(result);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		console.error('[/api/execute] Judge0 error:', message);

		// Distinguish timeout from unreachable
		if (message.includes('timeout') || message.includes('abort')) {
			return json(
				{
					error: 'Execution timed out',
					success: false,
					stdout: '',
					stderr: 'The execution service did not respond in time. Try again.',
					compile_output: '',
					status: { id: -1, description: 'Gateway Timeout' },
					time: '0s',
					memory: '0 KB',
					executionMode: 'judge0' as const
				},
				{ status: 504 }
			);
		}

		return json(
			{
				error: 'Execution service unavailable',
				success: false,
				stdout: '',
				stderr: `Cannot reach Judge0: ${message}`,
				compile_output: '',
				status: { id: -1, description: 'Service Unavailable' },
				time: '0s',
				memory: '0 KB',
				executionMode: 'judge0' as const
			},
			{ status: 503 }
		);
	}
};

// ─── Health Check ───────────────────────────────────────────

/** GET handler — returns Judge0 health status for diagnostics */
export const GET: RequestHandler = async () => {
	try {
		const { JUDGE0_URL } = await import('$lib/config');
		const response = await fetch(`${JUDGE0_URL}/about`, {
			signal: AbortSignal.timeout(5000)
		});

		if (response.ok) {
			const data = await response.json();
			return json({ status: 'ok', judge0: data });
		}

		return json(
			{ status: 'error', message: `Judge0 returned ${response.status}` },
			{ status: 502 }
		);
	} catch {
		return json(
			{ status: 'error', message: 'Cannot reach Judge0. Is docker-compose up?' },
			{ status: 502 }
		);
	}
};
