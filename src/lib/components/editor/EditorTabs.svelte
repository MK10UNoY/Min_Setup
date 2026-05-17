<script lang="ts">
	/**
	 * EditorTabs — horizontal tab bar for open files.
	 * Shows file name, dirty indicator, close button.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { getFileIcon } from '$lib/utils/fileTypes';

	function handleTabClick(path: string) {
		editorStore.setActive(path);
	}

	function handleCloseTab(e: MouseEvent, path: string) {
		e.stopPropagation();
		editorStore.closeTab(path);
	}

	function handleMiddleClick(e: MouseEvent, path: string) {
		if (e.button === 1) {
			e.preventDefault();
			editorStore.closeTab(path);
		}
	}
</script>

<div class="editor-tabs" role="tablist">
	{#each $editorStore.openTabs as tab (tab.path)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="tab"
			class:active={$editorStore.activeFilePath === tab.path}
			role="tab"
			tabindex="0"
			aria-selected={$editorStore.activeFilePath === tab.path}
			onclick={() => handleTabClick(tab.path)}
			onmousedown={(e) => handleMiddleClick(e, tab.path)}
			onkeydown={(e) => e.key === 'Enter' && handleTabClick(tab.path)}
			title={tab.path}
		>
			<span class="tab-icon">{getFileIcon(tab.name)}</span>
			<span class="tab-name">{tab.name}</span>
			{#if tab.isDirty}
				<span class="dirty-dot" title="Unsaved changes"></span>
			{/if}
			<button
				class="tab-close"
				onclick={(e) => handleCloseTab(e, tab.path)}
				title="Close"
				aria-label="Close {tab.name}"
			>
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.editor-tabs {
		display: flex;
		background: #1e1e1e;
		border-bottom: 1px solid #2d2d2d;
		overflow-x: auto;
		scrollbar-width: none;
		min-height: 36px;
	}

	.editor-tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: #2d2d2d;
		border: none;
		border-right: 1px solid #1e1e1e;
		color: #969696;
		font-size: 12.5px;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.15s, color 0.15s;
		font-family: inherit;
		min-width: 0;
	}

	.tab:hover {
		background: #353535;
		color: #cccccc;
	}

	.tab.active {
		background: #1e1e1e;
		color: #ffffff;
		border-bottom: 2px solid #007acc;
	}

	.tab-icon {
		font-size: 13px;
		flex-shrink: 0;
	}

	.tab-name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dirty-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #c6c6c6;
		flex-shrink: 0;
	}

	.tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		border: none;
		background: transparent;
		color: #969696;
		font-size: 15px;
		cursor: pointer;
		flex-shrink: 0;
		padding: 0;
		line-height: 1;
		opacity: 0;
		transition: opacity 0.1s, background 0.1s;
	}

	.tab:hover .tab-close {
		opacity: 1;
	}

	.tab-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}
</style>
