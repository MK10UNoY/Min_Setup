/**
 * File system store — manages the virtual file tree.
 * All files are stored in a flat map keyed by path.
 */
import { writable, derived } from 'svelte/store';

export interface VirtualFile {
	path: string;
	name: string;
	content: string;
	isDirectory: boolean;
	children?: string[]; // paths of children (for directories)
}

export interface FileStoreState {
	files: Record<string, VirtualFile>;
	rootPaths: string[]; // top-level entries
}

const DEFAULT_FILES: Record<string, VirtualFile> = {
	'/main.js': {
		path: '/main.js',
		name: 'main.js',
		content: `// Welcome to Low Setup Guru!\n// Write your JavaScript code here and press Run.\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nfor (let i = 0; i < 10; i++) {\n  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);\n}\n`,
		isDirectory: false
	},
	'/hello.py': {
		path: '/hello.py',
		name: 'hello.py',
		content: `# Python example\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))\nprint("Welcome to Low Setup Guru")\n`,
		isDirectory: false
	},
	'/main.c': {
		path: '/main.c',
		name: 'main.c',
		content: `#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    for (int i = 1; i <= 5; i++) {\n        printf("Count: %d\\n", i);\n    }\n    return 0;\n}\n`,
		isDirectory: false
	},
	'/main.cpp': {
		path: '/main.cpp',
		name: 'main.cpp',
		content: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> nums = {1, 2, 3, 4, 5};\n    std::cout << "Hello from C++!" << std::endl;\n    for (int n : nums) {\n        std::cout << "Value: " << n << std::endl;\n    }\n    return 0;\n}\n`,
		isDirectory: false
	},
	'/Main.java': {
		path: '/Main.java',
		name: 'Main.java',
		content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        for (int i = 0; i < 5; i++) {\n            System.out.println("Iteration: " + i);\n        }\n    }\n}\n`,
		isDirectory: false
	},
	'/index.ts': {
		path: '/index.ts',
		name: 'index.ts',
		content: `// TypeScript example\ninterface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user: User): string {\n  return \`Hello, \${user.name}! You are \${user.age} years old.\`;\n}\n\nconst user: User = { name: "Developer", age: 25 };\nconsole.log(greet(user));\n`,
		isDirectory: false
	}
};

function createFileStore() {
	const { subscribe, update, set } = writable<FileStoreState>({
		files: { ...DEFAULT_FILES },
		rootPaths: Object.keys(DEFAULT_FILES).sort()
	});

	function recalcRootPaths(files: Record<string, VirtualFile>): string[] {
		return Object.keys(files)
			.filter((p) => {
				const parts = p.split('/').filter(Boolean);
				return parts.length === 1;
			})
			.sort((a, b) => {
				const aDir = files[a]?.isDirectory ? 0 : 1;
				const bDir = files[b]?.isDirectory ? 0 : 1;
				if (aDir !== bDir) return aDir - bDir;
				return a.localeCompare(b);
			});
	}

	return {
		subscribe,

		addFile(path: string, content: string = '') {
			const name = path.split('/').pop() || path;
			update((state) => {
				state.files[path] = {
					path,
					name,
					content,
					isDirectory: false
				};
				state.rootPaths = recalcRootPaths(state.files);
				return state;
			});
		},

		addDirectory(path: string) {
			const name = path.split('/').pop() || path;
			update((state) => {
				state.files[path] = {
					path,
					name,
					content: '',
					isDirectory: true,
					children: []
				};
				state.rootPaths = recalcRootPaths(state.files);
				return state;
			});
		},

		updateFileContent(path: string, content: string) {
			update((state) => {
				if (state.files[path]) {
					state.files[path].content = content;
				}
				return state;
			});
		},

		deleteFile(path: string) {
			update((state) => {
				delete state.files[path];
				state.rootPaths = recalcRootPaths(state.files);
				return state;
			});
		},

		renameFile(oldPath: string, newPath: string) {
			update((state) => {
				const file = state.files[oldPath];
				if (file) {
					const newName = newPath.split('/').pop() || newPath;
					state.files[newPath] = { ...file, path: newPath, name: newName };
					delete state.files[oldPath];
					state.rootPaths = recalcRootPaths(state.files);
				}
				return state;
			});
		},

		getFile(path: string): VirtualFile | undefined {
			let result: VirtualFile | undefined;
			subscribe((state) => {
				result = state.files[path];
			})();
			return result;
		},

		reset() {
			set({
				files: { ...DEFAULT_FILES },
				rootPaths: Object.keys(DEFAULT_FILES).sort()
			});
		}
	};
}

export const fileStore = createFileStore();

/** Derived store: sorted list of all file paths */
export const allFilePaths = derived(fileStore, ($store) =>
	Object.keys($store.files)
		.filter((p) => !$store.files[p].isDirectory)
		.sort()
);
