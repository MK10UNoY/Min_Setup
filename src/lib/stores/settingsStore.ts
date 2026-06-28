import { writable } from 'svelte/store';

export interface SettingsState {
	theme: 'system' | 'light' | 'dark';
	accentColor: string; // HSL primary color values or classes
	sidebarDensity: 'compact' | 'comfortable';
	fontStyle: string; // key for the UI font family
	editorFontSize: number;
	editorLineNumbers: 'on' | 'off';
	editorWordWrap: 'on' | 'off';
	editorMinimap: boolean;
	editorAutoSave: boolean;
	editorTabSize: number;
	editorCursorStyle: 'line' | 'block' | 'underline';
	terminalFontSize: number;
	terminalCursorBlink: boolean;
	terminalClearOnRun: boolean;
	terminalScrollbackSize: number;
	defaultPanelLayout: string;
	restoreSession: boolean;
	autoOpenTerminal: boolean;
	highContrast: boolean;
	reducedMotion: boolean;
	largerUI: boolean;
	uiScale: number;
	roundedCorners: string;
}

/** Font style options — maps keys to CSS font-family stacks */
export const FONT_STYLE_OPTIONS: Record<string, { label: string; family: string }> = {
	'patrick-hand': { label: 'Patrick Hand (Sketchbook)', family: "'Patrick Hand', cursive" },
	'kalam': { label: 'Kalam (Handwritten)', family: "'Kalam', cursive" },
	'caveat': { label: 'Caveat (Casual Script)', family: "'Caveat', cursive" },
	'nunito': { label: 'Nunito (Rounded Sans)', family: "'Nunito', sans-serif" },
	'inter': { label: 'Inter (Clean Sans)', family: "'Inter', sans-serif" },
	'comic-neue': { label: 'Comic Neue (Fun)', family: "'Comic Neue', cursive" },
	'architects-daughter': { label: 'Architects Daughter (Blueprint)', family: "'Architects Daughter', cursive" },
	'indie-flower': { label: 'Indie Flower (Doodle)', family: "'Indie Flower', cursive" },
};

const DEFAULT_SETTINGS: SettingsState = {
	theme: 'system',
	accentColor: 'blue',
	sidebarDensity: 'comfortable',
	fontStyle: 'patrick-hand',
	editorFontSize: 14,
	editorLineNumbers: 'on',
	editorWordWrap: 'on',
	editorMinimap: true,
	editorAutoSave: false,
	editorTabSize: 2,
	editorCursorStyle: 'line',
	terminalFontSize: 13,
	terminalCursorBlink: true,
	terminalClearOnRun: false,
	terminalScrollbackSize: 1000,
	defaultPanelLayout: 'default',
	restoreSession: true,
	autoOpenTerminal: true,
	highContrast: false,
	reducedMotion: false,
	largerUI: false,
	uiScale: 1,
	roundedCorners: '6px'
};

function createSettingsStore() {
	let initial: SettingsState = { ...DEFAULT_SETTINGS };

	if (typeof window !== 'undefined') {
		try {
			const saved = localStorage.getItem('low-setup-guru-settings');
			if (saved) {
				initial = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
			}
		} catch (e) {
			console.error('Failed to parse settings from localStorage', e);
		}
	}

	const { subscribe, update, set } = writable<SettingsState>(initial);

	// Sync changes to localStorage and apply theme classes
	subscribe((state) => {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('low-setup-guru-settings', JSON.stringify(state));
			} catch (e) {
				console.error('Failed to save settings to localStorage', e);
			}
			applySettings(state);
		}
	});

	return {
		subscribe,
		update(fn: (state: SettingsState) => SettingsState) {
			update(fn);
		},
		set(state: SettingsState) {
			set(state);
		},
		updateSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
			update((state) => {
				state[key] = value;
				return state;
			});
		},
		reset() {
			set({ ...DEFAULT_SETTINGS });
		}
	};
}

export const settingsStore = createSettingsStore();

/**
 * Apply the settings values dynamically via attributes/CSS variables on the document element.
 */
function applySettings(state: SettingsState) {
	if (typeof document === 'undefined') return;

	const root = document.documentElement;

	// Theme handling
	let activeTheme = state.theme;
	if (state.theme === 'system') {
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		activeTheme = isDark ? 'dark' : 'light';
	}

	root.setAttribute('data-theme', activeTheme);
	root.setAttribute('data-sidebar-density', state.sidebarDensity);
	
	if (state.highContrast) {
		root.setAttribute('data-contrast', 'high');
	} else {
		root.removeAttribute('data-contrast');
	}

	if (state.reducedMotion) {
		root.setAttribute('data-motion', 'reduced');
	} else {
		root.removeAttribute('data-motion');
	}

	// Accent colors HSL mapping
	let primaryHSL = '220 100% 68%'; // default blue
	let secondaryHSL = '35 92% 68%';
	let successHSL = '142 70% 45%';
	let dangerHSL = '0 84% 65%';

	if (state.theme === 'light' || (state.theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
		// Sketchbook light mode overrides if accent colors aren't custom
		if (state.accentColor === 'blue') primaryHSL = '220 90% 50%';
		else if (state.accentColor === 'green') primaryHSL = '142 76% 36%';
		else if (state.accentColor === 'purple') primaryHSL = '270 76% 50%';
		else if (state.accentColor === 'red') primaryHSL = '0 72% 50%';
		else if (state.accentColor === 'orange') primaryHSL = '25 95% 50%';
	} else {
		// Dark mode accents
		if (state.accentColor === 'blue') primaryHSL = '210 100% 66%';
		else if (state.accentColor === 'green') primaryHSL = '142 70% 60%';
		else if (state.accentColor === 'purple') primaryHSL = '270 85% 75%';
		else if (state.accentColor === 'red') primaryHSL = '0 84% 68%';
		else if (state.accentColor === 'orange') primaryHSL = '25 95% 60%';
	}

	root.style.setProperty('--primary-hsl', primaryHSL);
	root.style.setProperty('--secondary-hsl', secondaryHSL);
	root.style.setProperty('--success-hsl', successHSL);
	root.style.setProperty('--danger-hsl', dangerHSL);
	
	root.style.setProperty('--ui-scale', state.uiScale.toString());
	root.style.setProperty('--border-radius', state.roundedCorners);
	root.style.setProperty('--terminal-font-size', `${state.terminalFontSize}px`);

	// Font style
	const fontOption = FONT_STYLE_OPTIONS[state.fontStyle];
	if (fontOption) {
		root.style.setProperty('--font-handwritten', fontOption.family);
	}
}

// Watch system theme change if set to system
if (typeof window !== 'undefined') {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		settingsStore.subscribe((state) => {
			if (state.theme === 'system') {
				applySettings(state);
			}
		})();
	});
}
