<script lang="ts">
	/**
	 * FileTreeItem — a single file or folder in the sidebar tree.
	 * Uses phosphor-svelte icons for file type and actions.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore, type VirtualFile } from '$lib/stores/fileStore';
	import { getFileColor } from '$lib/utils/fileTypes';
	import File from 'phosphor-svelte/lib/File';
	import FileJs from 'phosphor-svelte/lib/FileJs';
	import FileTs from 'phosphor-svelte/lib/FileTs';
	import FilePy from 'phosphor-svelte/lib/FilePy';
	import FileC from 'phosphor-svelte/lib/FileC';
	import FileCpp from 'phosphor-svelte/lib/FileCpp';
	import FileHtml from 'phosphor-svelte/lib/FileHtml';
	import FileCss from 'phosphor-svelte/lib/FileCss';
	import FileCode from 'phosphor-svelte/lib/FileCode';
	import FolderSimple from 'phosphor-svelte/lib/FolderSimple';
	import Trash from 'phosphor-svelte/lib/Trash';

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

	/** Pick the right phosphor icon component based on file extension */
	function getIconComponent(name: string) {
		const ext = name.split('.').pop()?.toLowerCase() ?? '';
		switch (ext) {
			case 'js': case 'mjs': case 'cjs': case 'jsx': return FileJs;
			case 'ts': case 'tsx': return FileTs;
			case 'py': return FilePy;
			case 'c': case 'h': return FileC;
			case 'cpp': case 'cc': case 'hpp': return FileCpp;
			case 'html': case 'htm': return FileHtml;
			case 'css': case 'scss': return FileCss;
			case 'json': case 'xml': case 'yaml': case 'yml': case 'md': case 'java': return FileCode;
			default: return File;
		}
	}
</script>

<div
	class="file-tree-item"
	class:active={isActive}
	class:directory={file.isDirectory}
	role="treeitem"
	tabindex="0"
	aria-selected={isActive}
	onclick={handleClick}
	ondblclick={handleDoubleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
	{#if isRenaming}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			class="rename-input"
			type="text"
			bind:value={renameValue}
			onblur={handleRenameSubmit}
			onkeydown={handleRenameKeydown}
			autofocus
		/>
	{:else}
		<span class="file-icon" style="color: {file.isDirectory ? '#dcb67a' : getFileColor(file.name)}">
			{#if file.isDirectory}
				<FolderSimple size={16} weight="fill" />
			{:else}
				{@const Icon = getIconComponent(file.name)}
				<Icon size={16} weight="duotone" />
			{/if}
		</span>
		<span class="file-name">{file.name}</span>
		<button
			class="delete-btn"
			onclick={handleDelete}
			title="Delete {file.name}"
			aria-label="Delete {file.name}"
		>
			<Trash size={13} />
		</button>
	{/if}
</div>

<style>
	.file-tree-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px 4px 16px;
		cursor: pointer;
		color: var(--text-primary);
		font-family: var(--font-handwritten);
		font-size: 16px;
		transition: background-color 0.1s;
		user-select: none;
		position: relative;
	}

	.file-tree-item:hover {
		background: rgba(45, 45, 45, 0.04);
	}

	/* Active file highlighted with pastel marker look */
	.file-tree-item.active {
		background: rgba(247, 178, 103, 0.3);
		color: var(--text-primary);
		border-radius: 4px 12px 4px 8px;
		box-shadow: inset 0 -2px 0 rgba(247, 178, 103, 0.5);
	}

	.file-tree-item:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}

	.file-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		width: 18px;
		justify-content: center;
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
		border: 1px solid transparent;
		border-radius: 4px;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.file-tree-item:hover .delete-btn {
		display: flex;
	}

	.delete-btn:hover {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--danger);
		transform: scale(1.1) rotate(5deg);
	}

	.rename-input {
		background: var(--bg-card);
		border: 2px solid var(--primary);
		border-radius: 4px;
		color: var(--text-primary);
		font-family: var(--font-handwritten);
		font-size: 14px;
		padding: 1px 6px;
		width: 100%;
		outline: none;
	}
</style>
