<script lang="ts">
	/**
	 * PreviewPanel — right-side iframe for live HTML/CSS/JS preview.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore } from '$lib/stores/fileStore';
	import { uiStore } from '$lib/stores/uiStore';

	let iframeSrc = $state('');
	let iframeEl: HTMLIFrameElement;

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
		<span class="preview-title">Preview</span>
		<div class="preview-actions">
			<button class="preview-btn" onclick={handleRefresh} title="Refresh">
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M13.65 2.35A8 8 0 1015 8h-2a6 6 0 11-1.76-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<path d="M14 2v4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
			<button class="preview-btn" onclick={handleClose} title="Close Preview">
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
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
				<span class="preview-empty-icon">🌐</span>
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
		background: #1e1e1e;
		border-left: 1px solid #2d2d2d;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 12px;
		background: #252526;
		border-bottom: 1px solid #2d2d2d;
		min-height: 34px;
	}

	.preview-title {
		font-size: 11px;
		font-weight: 600;
		color: #bbbbbb;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.preview-actions {
		display: flex;
		gap: 2px;
	}

	.preview-btn {
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

	.preview-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #cccccc;
	}

	.preview-content {
		flex: 1;
		min-height: 0;
	}

	.preview-iframe {
		width: 100%;
		height: 100%;
		border: none;
		background: #ffffff;
	}

	.preview-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #5e5e5e;
		text-align: center;
		padding: 2rem;
	}

	.preview-empty-icon {
		font-size: 32px;
		margin-bottom: 12px;
		opacity: 0.5;
	}

	.preview-empty p {
		font-size: 12px;
		max-width: 200px;
	}
</style>
