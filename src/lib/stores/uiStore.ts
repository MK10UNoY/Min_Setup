/**
 * UI state store — manages panel visibility, layout state, and language filter.
 */
import { writable } from 'svelte/store';

export interface UIStoreState {
	sidebarOpen: boolean;
	terminalOpen: boolean;
	previewOpen: boolean;
	settingsOpen: boolean;
	terminalHeight: number; // percentage of viewport
	sidebarWidth: number; // pixels
	previewWidth: number; // pixels
	previewMode: 'sidebar' | 'tab' | 'bottom' | 'detached';
	selectedLanguage: string; // '' = show all, otherwise filter key like 'javascript', 'python', etc.
}

function createUIStore() {
	const { subscribe, update, set } = writable<UIStoreState>({
		sidebarOpen: true,
		terminalOpen: true,
		previewOpen: false,
		settingsOpen: false,
		terminalHeight: 30,
		sidebarWidth: 240,
		previewWidth: 400,
		previewMode: 'sidebar',
		selectedLanguage: ''
	});

	return {
		subscribe,

		toggleSidebar() {
			update((state) => {
				state.sidebarOpen = !state.sidebarOpen;
				return state;
			});
		},

		toggleTerminal() {
			update((state) => {
				state.terminalOpen = !state.terminalOpen;
				return state;
			});
		},

		togglePreview() {
			update((state) => {
				state.previewOpen = !state.previewOpen;
				return state;
			});
		},

		toggleSettings() {
			update((state) => {
				state.settingsOpen = !state.settingsOpen;
				return state;
			});
		},

		setSettingsOpen(open: boolean) {
			update((state) => {
				state.settingsOpen = open;
				return state;
			});
		},

		setSidebarOpen(open: boolean) {
			update((state) => {
				state.sidebarOpen = open;
				return state;
			});
		},

		setTerminalHeight(height: number) {
			update((state) => {
				state.terminalHeight = Math.max(15, Math.min(70, height));
				return state;
			});
		},

		setSidebarWidth(width: number) {
			update((state) => {
				state.sidebarWidth = Math.max(180, Math.min(500, width));
				return state;
			});
		},

		setPreviewWidth(width: number) {
			update((state) => {
				state.previewWidth = Math.max(200, Math.min(800, width));
				return state;
			});
		},

		setPreviewMode(mode: 'sidebar' | 'tab' | 'bottom' | 'detached') {
			update((state) => {
				state.previewMode = mode;
				if (mode === 'detached' || mode === 'tab' || mode === 'bottom') {
					state.previewOpen = true; // ensure it is considered open/active in that layout
				}
				return state;
			});
		},

		setSelectedLanguage(language: string) {
			update((state) => {
				state.selectedLanguage = language;
				return state;
			});
		},

		reset() {
			set({
				sidebarOpen: true,
				terminalOpen: true,
				previewOpen: false,
				settingsOpen: false,
				terminalHeight: 30,
				sidebarWidth: 240,
				previewWidth: 400,
				previewMode: 'sidebar',
				selectedLanguage: ''
			});
		}
	};
}

export const uiStore = createUIStore();
