<script lang="ts">
	/**
	 * FileTreeItem — a single file or folder in the sidebar tree.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore, type VirtualFile } from '$lib/stores/fileStore';
	import { getFileIcon, getFileColor } from '$lib/utils/fileTypes';

	interface Props {
		file: VirtualFile;
	}

	let { file }: Props = $props();

	let isRenaming = $state(false);
	let renameValue = $state('');

	let isActive = $derived($editorStore.activeFilePath === file.path);

	function handleClick() {
		if (file.isDirectory) return;
		editorStore.openFile(file.path, file.name);
	}

	function handleDoubleClick() {
		isRenaming = true;
		renameValue = file.name;
	}

	function handleRenameSubmit() {
		if (renameValue && renameValue !== file.name) {
			const dir = file.path.substring(0, file.path.lastIndexOf('/'));
			const newPath = `${dir}/${renameValue}`;
			fileStore.renameFile(file.path, newPath);
			editorStore.closeTab(file.path);
			editorStore.openFile(newPath, renameValue);
		}
		isRenaming = false;
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleRenameSubmit();
		if (e.key === 'Escape') isRenaming = false;
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		editorStore.closeTab(file.path);
		fileStore.deleteFile(file.path);
	}
</script>

<div
	class="file-tree-item"
	class:active={isActive}
	class:directory={file.isDirectory}
	role="treeitem"
	tabindex="0"
	onclick={handleClick}
	ondblclick={handleDoubleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
	{#if isRenaming}
		<input
			class="rename-input"
			type="text"
			bind:value={renameValue}
			onblur={handleRenameSubmit}
			onkeydown={handleRenameKeydown}
			autofocus
		/>
	{:else}
		<span class="file-icon" style="color: {getFileColor(file.name)}">
			{#if file.isDirectory}
				📁
			{:else}
				{getFileIcon(file.name)}
			{/if}
		</span>
		<span class="file-name">{file.name}</span>
		<button
			class="delete-btn"
			onclick={handleDelete}
			title="Delete {file.name}"
			aria-label="Delete {file.name}"
		>
			×
		</button>
	{/if}
</div>

<style>
	.file-tree-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 12px 3px 16px;
		cursor: pointer;
		color: #cccccc;
		font-size: 13px;
		transition: background-color 0.1s;
		user-select: none;
		position: relative;
	}

	.file-tree-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.file-tree-item.active {
		background: rgba(0, 122, 204, 0.2);
		color: #ffffff;
	}

	.file-tree-item:focus-visible {
		outline: 1px solid #007acc;
		outline-offset: -1px;
	}

	.file-icon {
		font-size: 14px;
		flex-shrink: 0;
		width: 18px;
		text-align: center;
	}

	.file-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.delete-btn {
		display: none;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 3px;
		border: none;
		background: transparent;
		color: #808080;
		font-size: 15px;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}

	.file-tree-item:hover .delete-btn {
		display: flex;
	}

	.delete-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ff6b6b;
	}

	.rename-input {
		background: #2d2d2d;
		border: 1px solid #007acc;
		border-radius: 3px;
		color: #ffffff;
		font-size: 13px;
		padding: 1px 6px;
		width: 100%;
		outline: none;
		font-family: inherit;
	}
</style>
