<script lang="ts">
	/**
	 * Main IDE Layout — assembles all panels into a VSCode-like workspace.
	 */
	import Topbar from '$lib/components/topbar/Topbar.svelte';
	import Sidebar from '$lib/components/sidebar/Sidebar.svelte';
	import EditorPanel from '$lib/components/editor/EditorPanel.svelte';
	import TerminalPanel from '$lib/components/terminal/TerminalPanel.svelte';
	import PreviewPanel from '$lib/components/preview/PreviewPanel.svelte';
	import SettingsPanel from '$lib/components/settings/SettingsPanel.svelte';
	import { uiStore } from '$lib/stores/uiStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { onDestroy, onMount } from 'svelte';
	import { cleanupRunners } from '$lib/execution/router';

	// EditorPanel ref for format delegation
	let editorPanelRef: EditorPanel | undefined = $state();

	// Terminal resize state
	let isResizing = $state(false);
	let isResizingSidebar = $state(false);
	let isResizingPreview = $state(false);
	let mainContainer: HTMLDivElement;

	function handleResizeStart(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
		const startY = e.clientY;
		let startHeight: number;

		uiStore.subscribe((s) => (startHeight = s.terminalHeight))();

		function handleMouseMove(ev: MouseEvent) {
			if (!mainContainer) return;
			const containerRect = mainContainer.getBoundingClientRect();
			const deltaY = startY - ev.clientY;
			const deltaPercent = (deltaY / containerRect.height) * 100;
			uiStore.setTerminalHeight(startHeight + deltaPercent);
		}

		function handleMouseUp() {
			isResizing = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleSidebarResizeStart(e: MouseEvent) {
		e.preventDefault();
		isResizingSidebar = true;
		const startX = e.clientX;
		let startWidth: number;

		uiStore.subscribe((s) => (startWidth = s.sidebarWidth))();

		function handleMouseMove(ev: MouseEvent) {
			const deltaX = ev.clientX - startX;
			uiStore.setSidebarWidth(startWidth + deltaX);
		}

		function handleMouseUp() {
			isResizingSidebar = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handlePreviewResizeStart(e: MouseEvent) {
		e.preventDefault();
		isResizingPreview = true;
		const startX = e.clientX;
		let startWidth: number;

		uiStore.subscribe((s) => (startWidth = s.previewWidth))();

		function handleMouseMove(ev: MouseEvent) {
			const deltaX = startX - ev.clientX;
			uiStore.setPreviewWidth(startWidth + deltaX);
		}

		function handleMouseUp() {
			isResizingPreview = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleFormat() {
		editorPanelRef?.formatActiveDocument();
	}

	// Restore settings from localStorage on initial render
	onMount(() => {
		// Loaded automatically by settingsStore.
	});

	onDestroy(() => {
		cleanupRunners();
	});
</script>

<svelte:head>
	<title>Low Setup Guru — Code Playground</title>
</svelte:head>

<div class="ide-layout">
	<Topbar onformat={handleFormat} />

	<div class="ide-body">
		<Sidebar />
		
		{#if $uiStore.sidebarOpen}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="resize-handle-v"
				class:resizing={isResizingSidebar}
				role="separator"
				aria-orientation="vertical"
				onmousedown={handleSidebarResizeStart}
			></div>
		{/if}

		<div class="main-area" bind:this={mainContainer}>
			<!-- Editor (top portion) -->
			<div
				class="editor-area"
				style="flex: {$uiStore.terminalOpen ? `1 1 ${100 - $uiStore.terminalHeight}%` : '1 1 100%'}"
			>
				<div class="editor-and-preview">
					<div class="editor-main">
						<EditorPanel bind:this={editorPanelRef} />
					</div>
					{#if $uiStore.previewOpen && $uiStore.previewMode === 'sidebar'}
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<div
							class="resize-handle-v"
							class:resizing={isResizingPreview}
							role="separator"
							aria-orientation="vertical"
							onmousedown={handlePreviewResizeStart}
						></div>
						<PreviewPanel />
					{/if}
				</div>
			</div>

			<!-- Resize handle -->
			{#if $uiStore.terminalOpen}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="resize-handle"
					class:resizing={isResizing}
					role="separator"
					aria-orientation="horizontal"
					onmousedown={handleResizeStart}
				></div>

				<!-- Terminal (bottom portion) -->
				<div
					class="terminal-area"
					style="flex: 0 0 {$uiStore.terminalHeight}%"
				>
					<TerminalPanel />
				</div>
			{/if}
		</div>
	</div>

	{#if $uiStore.settingsOpen}
		<SettingsPanel />
	{/if}
</div>

<style>
	.ide-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: var(--bg-page);
	}

	.ide-body {
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.main-area {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		min-height: 0;
	}

	.editor-area {
		display: flex;
		min-height: 120px;
		overflow: hidden;
	}

	.editor-and-preview {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.editor-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.resize-handle {
		height: 6px;
		background: var(--border-color);
		cursor: ns-resize;
		flex-shrink: 0;
		transition: background 0.15s;
		position: relative;
	}

	.resize-handle::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 32px;
		height: 2px;
		background: var(--bg-paper);
		border-radius: 1px;
		opacity: 0.8;
		transition: opacity 0.15s;
	}

	.resize-handle:hover,
	.resize-handle.resizing {
		background: var(--primary);
	}

	.resize-handle:hover::after,
	.resize-handle.resizing::after {
		opacity: 1;
	}

	.resize-handle-v {
		width: 6px;
		background: var(--border-color);
		cursor: ew-resize;
		flex-shrink: 0;
		transition: background 0.15s;
		position: relative;
		z-index: 5;
	}

	.resize-handle-v::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 2px;
		height: 32px;
		background: var(--bg-paper);
		border-radius: 1px;
		opacity: 0.8;
		transition: opacity 0.15s;
	}

	.resize-handle-v:hover,
	.resize-handle-v.resizing {
		background: var(--primary);
	}

	.resize-handle-v:hover::after,
	.resize-handle-v.resizing::after {
		opacity: 1;
	}

	.terminal-area {
		display: flex;
		flex-direction: column;
		min-height: 100px;
		overflow: hidden;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.editor-and-preview {
			flex-direction: column;
		}
	}
</style>