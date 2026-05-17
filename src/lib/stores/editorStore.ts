/**
 * Editor state store — manages open tabs and active file.
 */
import { writable, derived } from 'svelte/store';

export interface EditorTab {
	path: string;
	name: string;
	isDirty: boolean;
}

export interface EditorStoreState {
	activeFilePath: string | null;
	openTabs: EditorTab[];
}

function createEditorStore() {
	const { subscribe, update, set } = writable<EditorStoreState>({
		activeFilePath: '/main.js',
		openTabs: [{ path: '/main.js', name: 'main.js', isDirty: false }]
	});

	return {
		subscribe,

		openFile(path: string, name?: string) {
			update((state) => {
				const existing = state.openTabs.find((t) => t.path === path);
				if (!existing) {
					const tabName = name || path.split('/').pop() || path;
					state.openTabs.push({ path, name: tabName, isDirty: false });
				}
				state.activeFilePath = path;
				return state;
			});
		},

		closeTab(path: string) {
			update((state) => {
				const idx = state.openTabs.findIndex((t) => t.path === path);
				if (idx === -1) return state;

				state.openTabs.splice(idx, 1);

				// If we closed the active tab, activate the nearest one
				if (state.activeFilePath === path) {
					if (state.openTabs.length === 0) {
						state.activeFilePath = null;
					} else {
						const newIdx = Math.min(idx, state.openTabs.length - 1);
						state.activeFilePath = state.openTabs[newIdx].path;
					}
				}
				return state;
			});
		},

		setActive(path: string) {
			update((state) => {
				state.activeFilePath = path;
				return state;
			});
		},

		markDirty(path: string, dirty: boolean = true) {
			update((state) => {
				const tab = state.openTabs.find((t) => t.path === path);
				if (tab) tab.isDirty = dirty;
				return state;
			});
		},

		closeAllTabs() {
			set({ activeFilePath: null, openTabs: [] });
		},

		closeOtherTabs(path: string) {
			update((state) => {
				state.openTabs = state.openTabs.filter((t) => t.path === path);
				state.activeFilePath = path;
				return state;
			});
		}
	};
}

export const editorStore = createEditorStore();

/** Derived: the currently active tab */
export const activeTab = derived(editorStore, ($editor) =>
	$editor.openTabs.find((t) => t.path === $editor.activeFilePath) ?? null
);
