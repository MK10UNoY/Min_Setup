<script lang="ts">
	/**
	 * EditorTabs — horizontal scrollable tab bar for open files.
	 * Shows file name, dirty indicator, close button.
	 * Supports horizontal scroll via mouse wheel when tabs overflow.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { getFileColor } from '$lib/utils/fileTypes';
	import X from 'phosphor-svelte/lib/X';
	import Circle from 'phosphor-svelte/lib/Circle';

	let tabsContainer: HTMLDivElement;

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

	/** Horizontal scroll via mouse wheel when tabs overflow */
	function handleWheel(e: WheelEvent) {
		if (!tabsContainer) return;
		if (tabsContainer.scrollWidth > tabsContainer.clientWidth) {
			e.preventDefault();
			tabsContainer.scrollLeft += e.deltaY;
		}
	}
</script>

<div
	class="editor-tabs"
	role="tablist"
	bind:this={tabsContainer}
	onwheel={handleWheel}
>
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
			<span class="tab-dot" style="color: {getFileColor(tab.name)}">
				<Circle size={8} weight="fill" />
			</span>
			<span class="tab-name">{tab.name}</span>
			{#if tab.isDirty}
				<span class="dirty-dot" title="Unsaved changes">
					<Circle size={8} weight="fill" />
				</span>
			{/if}
			<button
				class="tab-close"
				onclick={(e) => handleCloseTab(e, tab.path)}
				title="Close"
				aria-label="Close {tab.name}"
			>
				<X size={12} />
			</button>
		</div>
	{/each}
</div>

<style>
	.editor-tabs {
		display: flex;
		background: var(--bg-paper);
		border-bottom: 2px solid var(--border-color);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(45,45,45,0.2) transparent;
		min-height: 40px;
		scroll-behavior: smooth;
		padding-top: 4px;
		padding-left: 8px;
		position: relative;
		z-index: 5;
	}

	.editor-tabs::-webkit-scrollbar {
		height: 4px;
	}

	.editor-tabs::-webkit-scrollbar-track {
		background: transparent;
	}

	.editor-tabs::-webkit-scrollbar-thumb {
		background: rgba(45, 45, 45, 0.2);
		border-radius: 4px;
	}

	.editor-tabs::-webkit-scrollbar-thumb:hover {
		background: rgba(45, 45, 45, 0.4);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 14px;
		background: var(--bg-paper);
		border: 2px solid var(--border-color);
		border-bottom: none;
		border-radius: 12px 12px 0 0;
		color: var(--text-secondary);
		font-family: var(--font-handwritten);
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
		min-width: 0;
		flex-shrink: 0;
		margin-right: 4px;
		position: relative;
		bottom: -2px; /* Pull tab down to overlap the container border */
	}

	.tab:hover {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.tab.active {
		background: var(--bg-card);
		color: var(--text-primary);
		font-weight: bold;
		border-bottom: 2px solid var(--bg-card); /* Hide the container border line */
		z-index: 10;
		transform: translateY(-2px); /* Slight lift effect */
	}

	.tab-dot {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.tab-name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.dirty-dot {
		display: flex;
		align-items: center;
		color: var(--danger);
		flex-shrink: 0;
	}

	.tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		flex-shrink: 0;
		padding: 0;
		line-height: 1;
		opacity: 0;
		transition: all 0.15s ease;
	}

	.tab:hover .tab-close {
		opacity: 1;
	}

	.tab-close:hover {
		background: var(--bg-paper);
		border-color: var(--border-color);
		color: var(--danger);
		transform: scale(1.1) rotate(9deg);
	}
</style>
