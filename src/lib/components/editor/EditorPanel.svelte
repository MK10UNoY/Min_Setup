<script lang="ts">
	/**
	 * EditorPanel — combines tabs, breadcrumb, and Monaco editor.
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

	function handleEditorChange(newValue: string) {
		if ($editorStore.activeFilePath) {
			fileStore.updateFileContent($editorStore.activeFilePath, newValue);
			editorStore.markDirty($editorStore.activeFilePath, true);
		}
	}
</script>

<div class="editor-panel">
	<EditorTabs />
	<Breadcrumb />

	<div class="editor-content">
		{#if activeFile}
			{#key activeFile.path}
				<MonacoEditor
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
		background: #1e1e1e;
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
		color: #5e5e5e;
		text-align: center;
		padding: 2rem;
	}

	.empty-editor-icon {
		font-size: 48px;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.empty-editor h3 {
		font-size: 20px;
		color: #8e8e8e;
		margin-bottom: 8px;
		font-weight: 400;
	}

	.empty-editor p {
		font-size: 13px;
		color: #5e5e5e;
		max-width: 300px;
		margin-bottom: 24px;
	}

	.shortcuts {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 12px;
	}

	.shortcuts span {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.shortcuts kbd {
		background: #2d2d2d;
		border: 1px solid #404040;
		border-radius: 3px;
		padding: 2px 6px;
		font-size: 11px;
		font-family: inherit;
		color: #8e8e8e;
	}
</style>
