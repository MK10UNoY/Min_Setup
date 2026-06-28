/**
 * File type detection and language mapping utilities.
 */

export interface FileTypeInfo {
	language: string;
	icon: string;
	color: string;
	monacoLanguage: string;
}

const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
	'.js': { language: 'javascript', icon: '📜', color: '#f7df1e', monacoLanguage: 'javascript' },
	'.mjs': { language: 'javascript', icon: '📜', color: '#f7df1e', monacoLanguage: 'javascript' },
	'.cjs': { language: 'javascript', icon: '📜', color: '#f7df1e', monacoLanguage: 'javascript' },
	'.ts': { language: 'typescript', icon: '🔷', color: '#3178c6', monacoLanguage: 'typescript' },
	'.tsx': { language: 'typescriptreact', icon: '⚛️', color: '#61dafb', monacoLanguage: 'typescript' },
	'.jsx': { language: 'javascriptreact', icon: '⚛️', color: '#61dafb', monacoLanguage: 'javascript' },
	'.py': { language: 'python', icon: '🐍', color: '#3776ab', monacoLanguage: 'python' },
	'.c': { language: 'c', icon: '🔧', color: '#a8b9cc', monacoLanguage: 'c' },
	'.h': { language: 'c', icon: '🔧', color: '#a8b9cc', monacoLanguage: 'c' },
	'.cpp': { language: 'cpp', icon: '⚙️', color: '#00599c', monacoLanguage: 'cpp' },
	'.cc': { language: 'cpp', icon: '⚙️', color: '#00599c', monacoLanguage: 'cpp' },
	'.hpp': { language: 'cpp', icon: '⚙️', color: '#00599c', monacoLanguage: 'cpp' },
	'.java': { language: 'java', icon: '☕', color: '#ed8b00', monacoLanguage: 'java' },
	'.json': { language: 'json', icon: '📋', color: '#a6a6a6', monacoLanguage: 'json' },
	'.html': { language: 'html', icon: '🌐', color: '#e34c26', monacoLanguage: 'html' },
	'.htm': { language: 'html', icon: '🌐', color: '#e34c26', monacoLanguage: 'html' },
	'.css': { language: 'css', icon: '🎨', color: '#1572b6', monacoLanguage: 'css' },
	'.scss': { language: 'scss', icon: '🎨', color: '#cc6699', monacoLanguage: 'scss' },
	'.md': { language: 'markdown', icon: '📝', color: '#ffffff', monacoLanguage: 'markdown' },
	'.xml': { language: 'xml', icon: '📄', color: '#e37933', monacoLanguage: 'xml' },
	'.yaml': { language: 'yaml', icon: '📄', color: '#cb171e', monacoLanguage: 'yaml' },
	'.yml': { language: 'yaml', icon: '📄', color: '#cb171e', monacoLanguage: 'yaml' },
	'.sh': { language: 'shell', icon: '💻', color: '#89e051', monacoLanguage: 'shell' },
	'.sql': { language: 'sql', icon: '🗄️', color: '#e38c00', monacoLanguage: 'sql' },
	'.txt': { language: 'plaintext', icon: '📄', color: '#a6a6a6', monacoLanguage: 'plaintext' }
};

const DEFAULT_FILE_TYPE: FileTypeInfo = {
	language: 'plaintext',
	icon: '📄',
	color: '#a6a6a6',
	monacoLanguage: 'plaintext'
};

export function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf('.');
	if (lastDot === -1) return '';
	return filename.substring(lastDot).toLowerCase();
}

export function getFileType(filename: string): FileTypeInfo {
	const ext = getFileExtension(filename);
	return FILE_TYPE_MAP[ext] ?? DEFAULT_FILE_TYPE;
}

export function getMonacoLanguage(filename: string): string {
	return getFileType(filename).monacoLanguage;
}

export function getFileIcon(filename: string): string {
	return getFileType(filename).icon;
}

export function getFileColor(filename: string): string {
	return getFileType(filename).color;
}

export function isExecutableFile(filename: string): boolean {
	const ext = getFileExtension(filename);
	return ['.js', '.mjs', '.cjs', '.ts', '.py', '.c', '.cpp', '.cc', '.java'].includes(ext);
}

/** Determine which execution backend a file needs */
export type ExecutionBackend = 'nodebox' | 'judge0' | 'preview' | 'none';

export function getExecutionBackend(filename: string): ExecutionBackend {
	const ext = getFileExtension(filename);
	if (['.js', '.mjs', '.cjs', '.ts'].includes(ext)) return 'nodebox';
	if (['.c', '.cpp', '.cc', '.java', '.py'].includes(ext)) return 'judge0';
	if (['.html', '.htm'].includes(ext)) return 'preview';
	return 'none';
}

/**
 * Language groups for the sidebar filter dropdown.
 * Each group has a label and a set of file extensions that belong to it.
 */
export const LANGUAGE_GROUPS: { key: string; label: string; extensions: string[] }[] = [
	{ key: 'javascript', label: 'JavaScript', extensions: ['.js', '.mjs', '.cjs', '.jsx'] },
	{ key: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx'] },
	{ key: 'python', label: 'Python', extensions: ['.py'] },
	{ key: 'c', label: 'C', extensions: ['.c', '.h'] },
	{ key: 'cpp', label: 'C++', extensions: ['.cpp', '.cc', '.hpp'] },
	{ key: 'java', label: 'Java', extensions: ['.java'] },
	{ key: 'web', label: 'HTML / CSS', extensions: ['.html', '.htm', '.css', '.scss'] },
	{ key: 'other', label: 'Other', extensions: ['.json', '.md', '.xml', '.yaml', '.yml', '.sh', '.sql', '.txt'] }
];

/** Get the language group key for a filename */
export function getLanguageGroup(filename: string): string {
	const ext = getFileExtension(filename);
	for (const group of LANGUAGE_GROUPS) {
		if (group.extensions.includes(ext)) return group.key;
	}
	return 'other';
}
