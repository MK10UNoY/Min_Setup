/**
 * GET /api/languages — returns the full supported language list.
 * Each entry includes the execution mode so the frontend knows
 * whether to use Judge0, Nodebox, or iframe rendering.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LanguageInfo } from '$lib/execution/types';

const LANGUAGES: LanguageInfo[] = [
	{ id: 46, name: 'Bash', extension: 'sh', mode: 'judge0' },
	{ id: 50, name: 'C', extension: 'c', mode: 'wasm' },
	{ id: 51, name: 'C#', extension: 'cs', mode: 'judge0' },
	{ id: 54, name: 'C++', extension: 'cpp', mode: 'wasm' },
	{ id: 60, name: 'Go', extension: 'go', mode: 'judge0' },
	{ id: 62, name: 'Java', extension: 'java', mode: 'judge0' },
	{ id: 63, name: 'JavaScript', extension: 'js', mode: 'nodebox' },
	{ id: 64, name: 'Lua', extension: 'lua', mode: 'judge0' },
	{ id: 68, name: 'PHP', extension: 'php', mode: 'judge0' },
	{ id: 70, name: 'Python 2', extension: 'py', mode: 'judge0' },
	{ id: 71, name: 'Python 3', extension: 'py', mode: 'judge0' },
	{ id: 72, name: 'Ruby', extension: 'rb', mode: 'judge0' },
	{ id: 73, name: 'Rust', extension: 'rs', mode: 'judge0' },
	{ id: 74, name: 'TypeScript', extension: 'ts', mode: 'nodebox' },
	{ id: 76, name: 'C++ 17', extension: 'cpp', mode: 'wasm' },
	{ id: 78, name: 'Kotlin', extension: 'kt', mode: 'judge0' },
	{ id: 80, name: 'R', extension: 'r', mode: 'judge0' },
	{ id: 81, name: 'Scala', extension: 'scala', mode: 'judge0' },
	{ id: 82, name: 'SQL', extension: 'sql', mode: 'judge0' },
	{ id: 83, name: 'Swift', extension: 'swift', mode: 'judge0' },
	{ id: 85, name: 'Perl', extension: 'pl', mode: 'judge0' },
	{ id: -1, name: 'HTML', extension: 'html', mode: 'iframe' },
	{ id: -1, name: 'CSS', extension: 'css', mode: 'iframe' }
];

/** Allowed Judge0 language IDs — prefixed with _ for SvelteKit compatibility */
export const _ALLOWED_LANGUAGE_IDS: Set<number> = new Set(
	LANGUAGES.filter((l) => l.mode === 'judge0').map((l) => l.id)
);

export const GET: RequestHandler = async () => {
	return json(LANGUAGES, {
		headers: {
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
