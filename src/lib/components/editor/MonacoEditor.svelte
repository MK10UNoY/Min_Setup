<script lang="ts">
	/**
	 * MonacoEditor — wrapper around the Monaco editor instance.
	 * Handles creation, language switching, value sync, and cleanup.
	 * Exposes formatDocument() for external auto-format triggering.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { getMonacoLanguage } from '$lib/utils/fileTypes';
	import { settingsStore } from '$lib/stores/settingsStore';

	interface Props {
		value: string;
		filename: string;
		theme?: string;
		onchange?: (value: string) => void;
	}

	let { value, filename, onchange }: Props = $props();

	let editorContainer: HTMLDivElement;
	let editor: ReturnType<typeof import('monaco-editor').editor.create> | null = $state(null);
	let monaco: typeof import('monaco-editor') | null = $state(null);
	let isUpdatingFromProp = false;

	let activeTheme = $derived($settingsStore.theme);
	let isDark = $derived(
		activeTheme === 'dark' || 
		(activeTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
	);
	let monacoTheme = $derived(isDark ? 'vs-dark' : 'vs');

	onMount(async () => {
		const monacoModule = await import('$lib/monaco-setup');
		monaco = monacoModule.default;

		if (!editorContainer) return;

		const monacoLanguage = getMonacoLanguage(filename);

		editor = monaco.editor.create(editorContainer, {
			value,
			language: monacoLanguage,
			theme: monacoTheme,
			fontSize: $settingsStore.editorFontSize,
			fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
			fontLigatures: true,
			minimap: { enabled: $settingsStore.editorMinimap, scale: 1 },
			lineNumbers: $settingsStore.editorLineNumbers,
			renderLineHighlight: 'all',
			scrollBeyondLastLine: false,
			wordWrap: $settingsStore.editorWordWrap,
			tabSize: $settingsStore.editorTabSize,
			insertSpaces: true,
			automaticLayout: true,
			bracketPairColorization: { enabled: true },
			padding: { top: 12, bottom: 12 },
			smoothScrolling: true,
			cursorBlinking: $settingsStore.terminalCursorBlink ? 'blink' : 'solid',
			cursorSmoothCaretAnimation: 'on',
			roundedSelection: true,
			cursorStyle: $settingsStore.editorCursorStyle
		});

		editor.onDidChangeModelContent(() => {
			if (isUpdatingFromProp || !editor) return;
			onchange?.(editor.getValue());
		});
	});

	// Update Monaco options dynamically when settings change
	$effect(() => {
		// Read dependencies unconditionally at the top to register them in the tracking frame
		const theme = monacoTheme;
		const fontSize = $settingsStore.editorFontSize;
		const lineNumbers = $settingsStore.editorLineNumbers;
		const wordWrap = $settingsStore.editorWordWrap;
		const minimap = $settingsStore.editorMinimap;
		const tabSize = $settingsStore.editorTabSize;
		const cursorStyle = $settingsStore.editorCursorStyle;
		const cursorBlink = $settingsStore.terminalCursorBlink;

		if (editor && monaco) {
			editor.updateOptions({
				fontSize,
				lineNumbers,
				wordWrap,
				minimap: { enabled: minimap },
				tabSize,
				cursorStyle,
				cursorBlinking: cursorBlink ? 'blink' : 'solid'
			});
			monaco.editor.setTheme(theme);
		}
	});

	// Update language when filename changes
	$effect(() => {
		if (editor && monaco && filename) {
			const model = editor.getModel();
			if (model) {
				const newLang = getMonacoLanguage(filename);
				monaco.editor.setModelLanguage(model, newLang);
			}
		}
	});

	// Update value from prop (external changes)
	$effect(() => {
		if (editor && value !== undefined && value !== editor.getValue()) {
			isUpdatingFromProp = true;
			editor.setValue(value);
			isUpdatingFromProp = false;
		}
	});

	onDestroy(() => {
		editor?.dispose();
		editor = null;
	});

	/** Trigger Monaco's built-in auto-format action on the active document */
	export function formatDocument(): void {
		if (!editor) return;
		editor.getAction('editor.action.formatDocument')?.run();
	}
</script>

<div bind:this={editorContainer} class="monaco-editor-container"></div>

<style>
	.monaco-editor-container {
		width: 100%;
		height: 100%;
		min-height: 200px;
		border-left: 2px solid var(--border-color);
		border-right: 2px solid var(--border-color);
		border-bottom: 2px solid var(--border-color);
		background-color: var(--bg-card);
	}
</style>
