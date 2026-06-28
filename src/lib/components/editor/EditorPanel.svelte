<script lang="ts">
	/**
	 * EditorPanel — combines tabs, breadcrumb, and Monaco editor.
	 * Exposes formatActiveDocument() for toolbar integration.
	 */
	import EditorTabs from './EditorTabs.svelte';
	import Breadcrumb from './Breadcrumb.svelte';
	import MonacoEditor from './MonacoEditor.svelte';
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore } from '$lib/stores/fileStore';

	let activeFile = $derived(
		$editorStore.activeFilePath
			? $fileStore.files[$editorStore.activeFilePath]
			: null
	);

	let monacoRef: MonacoEditor | undefined = $state();

	function handleEditorChange(newValue: string) {
		if ($editorStore.activeFilePath) {
			fileStore.updateFileContent($editorStore.activeFilePath, newValue);
			editorStore.markDirty($editorStore.activeFilePath, true);
		}
	}

	/** Format the currently active document using Monaco's built-in formatter */
	export function formatActiveDocument(): void {
		monacoRef?.formatDocument();
	}
</script>

<div class="editor-panel">
	<EditorTabs />
	<Breadcrumb />

	<div class="editor-content">
		{#if activeFile}
			{#key activeFile.path}
				<MonacoEditor
					bind:this={monacoRef}
					value={activeFile.content}
					filename={activeFile.name}
					onchange={handleEditorChange}
				/>
			{/key}
		{:else}
			<div class="empty-editor">
				<div class="empty-editor-icon">📝</div>
				<h3>Low Setup Guru</h3>
				<p>Select a file from the sidebar or create a new one to get started.</p>
				<div class="shortcuts">
					<span><kbd>Ctrl</kbd>+<kbd>N</kbd> New File</span>
					<span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Run Code</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.editor-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-width: 0;
		background: var(--bg-page);
	}

	.editor-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.empty-editor {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem;
	}

	.empty-editor-icon {
		font-size: 48px;
		margin-bottom: 16px;
		opacity: 0.7;
	}

	.empty-editor h3 {
		font-family: var(--font-handwritten);
		font-size: 26px;
		color: var(--text-primary);
		margin-bottom: 8px;
		font-weight: 700;
	}

	.empty-editor p {
		font-family: var(--font-handwritten);
		font-size: 16px;
		color: var(--text-secondary);
		max-width: 300px;
		margin-bottom: 24px;
	}

	.shortcuts {
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 14px;
	}

	.shortcuts span {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-handwritten);
		font-size: 16px;
		color: var(--text-primary);
	}

	.shortcuts kbd {
		background: var(--bg-card);
		border: 1.5px solid var(--border-color);
		border-radius: 4px;
		padding: 2px 8px;
		font-size: 12px;
		font-family: var(--font-mono);
		color: var(--text-primary);
		box-shadow: 1.5px 1.5px 0 var(--border-color);
	}
</style>
