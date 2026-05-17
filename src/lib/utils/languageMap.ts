/**
 * Judge0 language ID mapping.
 * IDs correspond to Judge0 CE (Community Edition).
 * See: https://ce.judge0.com/languages
 */

export interface Judge0Language {
	id: number;
	name: string;
	extension: string;
}

export const JUDGE0_LANGUAGES: Record<string, Judge0Language> = {
	c: { id: 50, name: 'C (GCC 9.2.0)', extension: '.c' },
	cpp: { id: 54, name: 'C++ (GCC 9.2.0)', extension: '.cpp' },
	java: { id: 62, name: 'Java (OpenJDK 13.0.1)', extension: '.java' },
	python: { id: 71, name: 'Python (3.8.1)', extension: '.py' }
};

export function getJudge0LanguageId(language: string): number | null {
	return JUDGE0_LANGUAGES[language]?.id ?? null;
}

export function getLanguageFromExtension(extension: string): string | null {
	const ext = extension.startsWith('.') ? extension : `.${extension}`;
	for (const [lang, info] of Object.entries(JUDGE0_LANGUAGES)) {
		if (info.extension === ext) return lang;
	}
	return null;
}
