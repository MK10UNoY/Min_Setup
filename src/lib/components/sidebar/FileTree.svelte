<script lang="ts">
	/**
	 * FileTree — file explorer tree listing all project files.
	 */
	import { fileStore } from '$lib/stores/fileStore';
	import FileTreeItem from './FileTreeItem.svelte';

	let sortedFiles = $derived(
		Object.values($fileStore.files).sort((a, b) => {
			// Directories first, then alphabetical
			if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
			return a.name.localeCompare(b.name);
		})
	);
</script>

<div class="file-tree" role="tree" aria-label="File explorer">
	{#each sortedFiles as file (file.path)}
		<FileTreeItem {file} />
	{/each}

	{#if sortedFiles.length === 0}
		<div class="empty-tree">
			<span>No files yet</span>
		</div>
	{/if}
</div>

<style>
	.file-tree {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 4px 0;
	}

	.file-tree::-webkit-scrollbar {
		width: 6px;
	}

	.file-tree::-webkit-scrollbar-track {
		background: transparent;
	}

	.file-tree::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	.file-tree::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.empty-tree {
		padding: 16px;
		color: #5e5e5e;
		font-size: 12px;
		text-align: center;
	}
</style>
