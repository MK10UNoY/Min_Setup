<script lang="ts">
	/**
	 * Sidebar — collapsible left panel with file explorer and actions.
	 */
	import FileTree from './FileTree.svelte';
	import { fileStore } from '$lib/stores/fileStore';
	import { editorStore } from '$lib/stores/editorStore';
	import { uiStore } from '$lib/stores/uiStore';

	let newFileName = $state('');
	let showNewFileInput = $state(false);

	function handleNewFile() {
		showNewFileInput = true;
		newFileName = '';
	}

	function submitNewFile() {
		const name = newFileName.trim();
		if (name) {
			const path = `/${name}`;
			fileStore.addFile(path, `// ${name}\n`);
			editorStore.openFile(path, name);
		}
		showNewFileInput = false;
		newFileName = '';
	}

	function handleNewFileKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submitNewFile();
		if (e.key === 'Escape') {
			showNewFileInput = false;
			newFileName = '';
		}
	}

	function toggleSidebar() {
		uiStore.toggleSidebar();
	}
</script>

<aside class="sidebar" class:collapsed={!$uiStore.sidebarOpen}>
	<div class="sidebar-header">
		<span class="sidebar-title">EXPLORER</span>
		<div class="sidebar-actions">
			<button
				class="action-btn"
				onclick={handleNewFile}
				title="New File"
				aria-label="New File"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
			</button>
			<button
				class="action-btn"
				onclick={toggleSidebar}
				title="Collapse Sidebar"
				aria-label="Collapse Sidebar"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" stroke-width="1.2"/>
					<path d="M6 2v12" stroke="currentColor" stroke-width="1.2"/>
				</svg>
			</button>
		</div>
	</div>

	{#if showNewFileInput}
		<div class="new-file-input-row">
			<input
				class="new-file-input"
				type="text"
				placeholder="filename.js"
				bind:value={newFileName}
				onblur={submitNewFile}
				onkeydown={handleNewFileKeydown}
				autofocus
			/>
		</div>
	{/if}

	<FileTree />
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		width: 240px;
		min-width: 180px;
		background: #252526;
		border-right: 1px solid #2d2d2d;
		overflow: hidden;
		transition: width 0.2s ease, min-width 0.2s ease;
	}

	.sidebar.collapsed {
		width: 0;
		min-width: 0;
		border-right: none;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border-bottom: 1px solid #2d2d2d;
		min-height: 36px;
	}

	.sidebar-title {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.8px;
		color: #bbbbbb;
		text-transform: uppercase;
	}

	.sidebar-actions {
		display: flex;
		gap: 2px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: none;
		background: transparent;
		color: #808080;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		padding: 0;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #cccccc;
	}

	.new-file-input-row {
		padding: 4px 12px;
		border-bottom: 1px solid #2d2d2d;
	}

	.new-file-input {
		width: 100%;
		background: #2d2d2d;
		border: 1px solid #007acc;
		border-radius: 3px;
		color: #ffffff;
		font-size: 13px;
		padding: 3px 8px;
		outline: none;
		font-family: inherit;
	}

	.new-file-input::placeholder {
		color: #5e5e5e;
	}
</style>
