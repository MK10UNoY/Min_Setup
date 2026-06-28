<script lang="ts">
	/**
	 * Sidebar — collapsible left panel with language selector, file explorer, and actions.
	 */
	import FileTree from './FileTree.svelte';
	import { fileStore } from '$lib/stores/fileStore';
	import { editorStore } from '$lib/stores/editorStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { LANGUAGE_GROUPS } from '$lib/utils/fileTypes';
	import FilePlus from 'phosphor-svelte/lib/FilePlus';
	import SidebarSimple from 'phosphor-svelte/lib/SidebarSimple';
	import FunnelSimple from 'phosphor-svelte/lib/FunnelSimple';

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

	function handleLanguageChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		uiStore.setSelectedLanguage(target.value);
	}

	let hasFilter = $derived($uiStore.selectedLanguage !== '');
</script>

<aside 
	class="sidebar" 
	class:collapsed={!$uiStore.sidebarOpen}
	style="width: {$uiStore.sidebarOpen ? `${$uiStore.sidebarWidth}px` : '0px'}; min-width: {$uiStore.sidebarOpen ? `${$uiStore.sidebarWidth}px` : '0px'};"
>
	<div class="sidebar-header">
		<span class="sidebar-title">EXPLORER</span>
		<div class="sidebar-actions">
			<button
				class="action-btn"
				onclick={handleNewFile}
				title="New File"
				aria-label="New File"
			>
				<FilePlus size={16} />
			</button>
			<button
				class="action-btn"
				onclick={toggleSidebar}
				title="Collapse Sidebar"
				aria-label="Collapse Sidebar"
			>
				<SidebarSimple size={16} />
			</button>
		</div>
	</div>

	<!-- Language filter -->
	<div class="language-filter">
		<span class="filter-icon" class:active={hasFilter}>
			<FunnelSimple size={13} weight={hasFilter ? 'fill' : 'regular'} />
		</span>
		<select
			class="language-select"
			value={$uiStore.selectedLanguage}
			onchange={handleLanguageChange}
		>
			<option value="">All Languages</option>
			{#each LANGUAGE_GROUPS as group (group.key)}
				<option value={group.key}>{group.label}</option>
			{/each}
		</select>
	</div>

	{#if showNewFileInput}
		<div class="new-file-input-row">
			<!-- svelte-ignore a11y_autofocus -->
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
		background: var(--bg-paper);
		border-right: 2px solid var(--border-color);
		overflow: hidden;
	}

	.sidebar.collapsed {
		width: 0 !important;
		min-width: 0 !important;
		border-right: none;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border-bottom: 2px solid var(--border-color);
		min-height: 36px;
	}

	.sidebar-title {
		font-family: var(--font-handwritten);
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.8px;
		color: var(--text-primary);
		text-transform: uppercase;
	}

	.sidebar-actions {
		display: flex;
		gap: 4px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 1.5px solid transparent;
		border-radius: 4px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		padding: 0;
	}

	.action-btn:hover {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--text-primary);
		transform: rotate(-3deg);
	}

	.language-filter {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-bottom: 2px solid var(--border-color);
		background: rgba(0, 0, 0, 0.02);
	}

	.filter-icon {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		flex-shrink: 0;
		transition: color 0.15s;
	}

	.filter-icon.active {
		color: var(--primary);
	}

	.language-select {
		flex: 1;
		background: var(--bg-card);
		border: 2px solid var(--border-color);
		border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
		color: var(--text-primary);
		font-family: var(--font-handwritten);
		font-size: 14px;
		padding: 2px 6px;
		outline: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.language-select:hover {
		transform: scale(1.02);
	}

	.language-select:focus {
		border-color: var(--primary);
	}

	.language-select option {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.new-file-input-row {
		padding: 6px 12px;
		border-bottom: 2px solid var(--border-color);
	}

	.new-file-input {
		width: 100%;
		background: var(--bg-card);
		border: 2px solid var(--primary);
		border-radius: 6px;
		color: var(--text-primary);
		font-family: var(--font-handwritten);
		font-size: 14px;
		padding: 3px 8px;
		outline: none;
	}

	.new-file-input::placeholder {
		color: var(--text-muted);
	}
</style>
