/**
 * Terminal output store — manages terminal lines and active tab.
 */
import { writable } from 'svelte/store';

export type TerminalLineType = 'stdout' | 'stderr' | 'system' | 'stdin';

export interface TerminalLine {
	text: string;
	type: TerminalLineType;
	timestamp: number;
}

export type TerminalTab = 'output' | 'terminal' | 'problems' | 'preview';

export interface TerminalStoreState {
	lines: TerminalLine[];
	activeTab: TerminalTab;
	stdinValue: string;
}

function createTerminalStore() {
	const { subscribe, update, set } = writable<TerminalStoreState>({
		lines: [],
		activeTab: 'output',
		stdinValue: ''
	});

	return {
		subscribe,

		appendLine(text: string, type: TerminalLineType = 'stdout') {
			update((state) => {
				state.lines.push({ text, type, timestamp: Date.now() });
				return state;
			});
		},

		appendLines(text: string, type: TerminalLineType = 'stdout') {
			const lines = text.split('\n');
			update((state) => {
				const timestamp = Date.now();
				for (const line of lines) {
					state.lines.push({ text: line, type, timestamp });
				}
				return state;
			});
		},

		setStdin(value: string) {
			update((state) => {
				state.stdinValue = value;
				return state;
			});
		},

		setActiveTab(tab: TerminalTab) {
			update((state) => {
				state.activeTab = tab;
				return state;
			});
		},

		clear() {
			update((state) => {
				state.lines = [];
				return state;
			});
		},

		systemMessage(text: string) {
			update((state) => {
				state.lines.push({ text, type: 'system', timestamp: Date.now() });
				return state;
			});
		},

		reset() {
			set({ lines: [], activeTab: 'output', stdinValue: '' });
		}
	};
}

export const terminalStore = createTerminalStore();
