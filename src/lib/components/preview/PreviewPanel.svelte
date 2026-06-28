<script lang="ts">
	/**
	 * PreviewPanel — right-side iframe for live HTML/CSS/JS preview.
	 * Uses phosphor-svelte icons.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore } from '$lib/stores/fileStore';
	import { uiStore } from '$lib/stores/uiStore';
	import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';
	import X from 'phosphor-svelte/lib/X';
	import Globe from 'phosphor-svelte/lib/Globe';

	let iframeSrc = $state('');
	let iframeEl: HTMLIFrameElement | undefined = $state();

	let activeFile = $derived(
		$editorStore.activeFilePath
			? $fileStore.files[$editorStore.activeFilePath]
			: null
	);

	let isHtml = $derived(
		activeFile?.name.endsWith('.html') || activeFile?.name.endsWith('.htm')
	);

	function handleRefresh() {
		if (!activeFile || !isHtml) return;

		// Create a blob URL from the HTML content
		const blob = new Blob([activeFile.content], { type: 'text/html' });
		const url = URL.createObjectURL(blob);

		// Revoke old URL if exists
		if (iframeSrc) {
			URL.revokeObjectURL(iframeSrc);
		}

		iframeSrc = url;
	}

	function handleClose() {
		uiStore.togglePreview();
	}

	// Auto-refresh when content changes (debounced)
	let refreshTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (activeFile && isHtml) {
			clearTimeout(refreshTimeout);
			refreshTimeout = setTimeout(handleRefresh, 500);
		}
	});
</script>

<div class="preview-panel">
	<div class="preview-header">
		<span class="preview-title">PREVIEW</span>
		<div class="preview-actions">
			<button class="preview-btn" onclick={handleRefresh} title="Refresh" aria-label="Refresh Preview">
				<ArrowClockwise size={14} />
			</button>
			<button class="preview-btn" onclick={handleClose} title="Close Preview" aria-label="Close Preview">
				<X size={14} />
			</button>
		</div>
	</div>

	<div class="preview-content">
		{#if isHtml && iframeSrc}
			<iframe
				bind:this={iframeEl}
				src={iframeSrc}
				title="Live Preview"
				sandbox="allow-scripts allow-same-origin"
				class="preview-iframe"
			></iframe>
		{:else}
			<div class="preview-empty">
				<span class="preview-empty-icon">
					<Globe size={32} />
				</span>
				<p>Open an HTML file to see a live preview</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.preview-panel {
		display: flex;
		flex-direction: column;
		width: 400px;
		min-width: 250px;
		background: var(--bg-paper);
		border-left: 2px solid var(--border-color);
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 12px;
		background: var(--bg-paper);
		border-bottom: 2px solid var(--border-color);
		min-height: 38px;
	}

	.preview-title {
		font-family: var(--font-handwritten);
		font-size: 15px;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: 0.5px;
	}

	.preview-actions {
		display: flex;
		gap: 4px;
	}

	.preview-btn {
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

	.preview-btn:hover {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--text-primary);
		transform: rotate(3deg);
	}

	.preview-content {
		flex: 1;
		min-height: 0;
		padding: 8px;
		background-color: var(--bg-page);
	}

	.preview-iframe {
		width: 100%;
		height: 100%;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		background: #ffffff;
		box-shadow: 2px 2px 0 var(--border-color);
	}

	.preview-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-secondary);
		text-align: center;
		padding: 2rem;
		font-family: var(--font-handwritten);
	}

	.preview-empty-icon {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		opacity: 0.7;
	}

	.preview-empty p {
		font-size: 16px;
		max-width: 200px;
	}
</style>
