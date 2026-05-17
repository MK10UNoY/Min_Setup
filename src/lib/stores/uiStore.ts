/**
 * UI state store — manages panel visibility and layout state.
 */
import { writable } from 'svelte/store';

export interface UIStoreState {
	sidebarOpen: boolean;
	terminalOpen: boolean;
	previewOpen: boolean;
	terminalHeight: number; // percentage of viewport
	sidebarWidth: number; // pixels
}

function createUIStore() {
	const { subscribe, update, set } = writable<UIStoreState>({
		sidebarOpen: true,
		terminalOpen: true,
		previewOpen: false,
		terminalHeight: 30,
		sidebarWidth: 240
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

		reset() {
			set({
				sidebarOpen: true,
				terminalOpen: true,
				previewOpen: false,
				terminalHeight: 30,
				sidebarWidth: 240
			});
		}
	};
}

export const uiStore = createUIStore();
