<script lang="ts">
	/**
	 * Main IDE Layout — assembles all panels into a VSCode-like workspace.
	 */
	import Topbar from '$lib/components/topbar/Topbar.svelte';
	import Sidebar from '$lib/components/sidebar/Sidebar.svelte';
	import EditorPanel from '$lib/components/editor/EditorPanel.svelte';
	import TerminalPanel from '$lib/components/terminal/TerminalPanel.svelte';
	import PreviewPanel from '$lib/components/preview/PreviewPanel.svelte';
	import { uiStore } from '$lib/stores/uiStore';
	import { onDestroy } from 'svelte';
	import { cleanupRunners } from '$lib/execution/router';

	// Terminal resize state
	let isResizing = $state(false);
	let mainContainer: HTMLDivElement;

	function handleResizeStart(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
		const startY = e.clientY;
		let startHeight: number;

		// Get the current terminal height %
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

	onDestroy(() => {
		cleanupRunners();
	});
</script>

<svelte:head>
	<title>Low Setup Guru — Code Playground</title>
</svelte:head>

<div class="ide-layout">
	<Topbar />

	<div class="ide-body">
		{#if $uiStore.sidebarOpen}
			<Sidebar />
		{/if}

		<div class="main-area" bind:this={mainContainer}>
			<!-- Editor (top portion) -->
			<div
				class="editor-area"
				style="flex: {$uiStore.terminalOpen ? `1 1 ${100 - $uiStore.terminalHeight}%` : '1 1 100%'}"
			>
				<div class="editor-and-preview">
					<div class="editor-main">
						<EditorPanel />
					</div>
					{#if $uiStore.previewOpen}
						<PreviewPanel />
					{/if}
				</div>
			</div>

			<!-- Resize handle -->
			{#if $uiStore.terminalOpen}
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
</div>

<style>
	.ide-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background: #16161e;
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
		height: 4px;
		background: #2d2d2d;
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
		background: #4e4e4e;
		border-radius: 1px;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.resize-handle:hover,
	.resize-handle.resizing {
		background: #007acc;
	}

	.resize-handle:hover::after,
	.resize-handle.resizing::after {
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