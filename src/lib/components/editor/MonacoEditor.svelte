<script lang="ts">
	/**
	 * MonacoEditor — wrapper around the Monaco editor instance.
	 * Handles creation, language switching, value sync, and cleanup.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { getMonacoLanguage } from '$lib/utils/fileTypes';

	interface Props {
		value: string;
		filename: string;
		theme?: string;
		onchange?: (value: string) => void;
	}

	let { value, filename, theme = 'vs-dark', onchange }: Props = $props();

	let editorContainer: HTMLDivElement;
	let editor: ReturnType<typeof import('monaco-editor').editor.create> | null = null;
	let monaco: typeof import('monaco-editor') | null = null;
	let isUpdatingFromProp = false;

	onMount(async () => {
		const monacoModule = await import('$lib/monaco-setup');
		monaco = monacoModule.default;

		if (!editorContainer) return;

		const monacoLanguage = getMonacoLanguage(filename);

		editor = monaco.editor.create(editorContainer, {
			value,
			language: monacoLanguage,
			theme,
			fontSize: 14,
			fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
			fontLigatures: true,
			minimap: { enabled: true, scale: 1 },
			lineNumbers: 'on',
			renderLineHighlight: 'all',
			scrollBeyondLastLine: false,
			wordWrap: 'on',
			tabSize: 2,
			insertSpaces: true,
			automaticLayout: true,
			bracketPairColorization: { enabled: true },
			padding: { top: 12, bottom: 12 },
			smoothScrolling: true,
			cursorBlinking: 'smooth',
			cursorSmoothCaretAnimation: 'on',
			roundedSelection: true
		});

		editor.onDidChangeModelContent(() => {
			if (isUpdatingFromProp || !editor) return;
			onchange?.(editor.getValue());
		});
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
</script>

<div bind:this={editorContainer} class="monaco-editor-container"></div>

<style>
	.monaco-editor-container {
		width: 100%;
		height: 100%;
		min-height: 200px;
	}
</style>
