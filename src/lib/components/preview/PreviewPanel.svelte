<script lang="ts">
	/**
	 * PreviewPanel — right-side iframe for live HTML/CSS/JS preview.
	 * Now supports resizable sidebar width, editor tabs integration,
	 * terminal tabs integration, and detachable popup windows.
	 * Uses phosphor-svelte icons.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore } from '$lib/stores/fileStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { terminalStore } from '$lib/stores/terminalStore';
	import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';
	import X from 'phosphor-svelte/lib/X';
	import Globe from 'phosphor-svelte/lib/Globe';
	import ArrowSquareOut from 'phosphor-svelte/lib/ArrowSquareOut';

	let iframeSrc = $state('');
	let iframeEl: HTMLIFrameElement | undefined = $state();
	let detachedWindow: Window | null = null;

	let activeFile = $derived(
		$editorStore.activeFilePath && $editorStore.activeFilePath !== 'preview'
			? $fileStore.files[$editorStore.activeFilePath]
			: (() => {
				const openHtmlTab = $editorStore.openTabs.find(t => t.name.endsWith('.html') || t.name.endsWith('.htm'));
				if (openHtmlTab) return $fileStore.files[openHtmlTab.path];
				return Object.values($fileStore.files).find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
			})() || null
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

	function openDetached() {
		if (!isHtml || !iframeSrc) return;
		try {
			if (detachedWindow && !detachedWindow.closed) {
				detachedWindow.location.replace(iframeSrc);
				detachedWindow.focus();
			} else {
				detachedWindow = window.open(iframeSrc, 'LowSetupPreview', 'width=800,height=600,menubar=no,toolbar=no,location=no');
			}
		} catch (e) {
			console.error("Failed to open detached preview window:", e);
		}
	}

	// Watch for change in iframeSrc and update detached window if open
	$effect(() => {
		if ($uiStore.previewMode === 'detached' && iframeSrc) {
			if (detachedWindow && !detachedWindow.closed) {
				try {
					detachedWindow.location.replace(iframeSrc);
				} catch (e) {
					detachedWindow = window.open(iframeSrc, 'LowSetupPreview', 'width=800,height=600');
				}
			}
		}
	});

	// Trigger opening when detached mode is selected
	$effect(() => {
		if ($uiStore.previewMode === 'detached' && iframeSrc) {
			const t = setTimeout(openDetached, 150);
			return () => clearTimeout(t);
		}
	});

	// Auto-refresh when content changes (debounced)
	let refreshTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (activeFile && isHtml) {
			clearTimeout(refreshTimeout);
			refreshTimeout = setTimeout(handleRefresh, 500);
		}
	});
</script>

<div 
	class="preview-panel" 
	class:in-sidebar={$uiStore.previewMode === 'sidebar'}
	style={$uiStore.previewMode === 'sidebar' ? `width: ${$uiStore.previewWidth}px;` : ''}
>
	<div class="preview-header">
		<span class="preview-title">
			{#if $uiStore.previewMode === 'sidebar'}
				PREVIEW
			{:else if $uiStore.previewMode === 'bottom'}
				LIVE PREVIEW PANEL
			{:else}
				PREVIEW EDITOR TAB
			{/if}
		</span>
		
		<div class="preview-actions">
			<select 
				class="preview-mode-select" 
				value={$uiStore.previewMode}
				onchange={(e) => {
					const val = e.currentTarget.value as any;
					uiStore.setPreviewMode(val);
					if (val === 'bottom') {
						terminalStore.setActiveTab('preview');
					} else if (val === 'tab') {
						editorStore.setActive('preview');
					}
				}}
				title="Change Preview Layout"
			>
				<option value="sidebar">Sidebar Layout</option>
				<option value="tab">Editor Tab</option>
				<option value="bottom">Terminal Tab</option>
				<option value="detached">Detached Window</option>
			</select>

			<button class="preview-btn" onclick={handleRefresh} title="Refresh Preview" aria-label="Refresh Preview">
				<ArrowClockwise size={14} />
			</button>
			<button class="preview-btn" onclick={handleClose} title="Close Preview" aria-label="Close Preview">
				<X size={14} />
			</button>
		</div>
	</div>

	<div class="preview-content">
		{#if isHtml && iframeSrc}
			{#if $uiStore.previewMode === 'detached'}
				<div class="preview-empty">
					<span class="preview-empty-icon" style="color: var(--primary);">
						<ArrowSquareOut size={36} />
					</span>
					<h4 style="font-family: var(--font-handwritten); font-size: 20px; font-weight: 700; margin-bottom: 8px;">Detached Window Mode</h4>
					<p style="font-size: 15px; margin-bottom: 16px;">The live preview is running in a separate pop-up window/tab.</p>
					<button class="sketch-button" onclick={openDetached}>
						Focus Preview Window
					</button>
				</div>
			{:else}
				<iframe
					bind:this={iframeEl}
					src={iframeSrc}
					title="Live Preview"
					sandbox="allow-scripts allow-same-origin"
					class="preview-iframe"
				></iframe>
			{/if}
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
		height: 100%;
		background: var(--bg-paper);
	}

	.preview-panel.in-sidebar {
		min-width: 200px;
		border-left: 2px solid var(--border-color);
	}

	.preview-panel:not(.in-sidebar) {
		width: 100% !important;
		border-left: none;
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
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: 0.5px;
	}

	.preview-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.preview-mode-select {
		background: var(--bg-card);
		border: 1.5px solid var(--border-color);
		border-radius: 4px;
		color: var(--text-primary);
		font-family: var(--font-handwritten);
		font-size: 12px;
		font-weight: 600;
		padding: 2px 4px;
		outline: none;
		cursor: pointer;
		margin-right: 4px;
	}

	.preview-mode-select:hover {
		border-color: var(--primary);
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
		min-height: fit-content;
		color: var(--text-secondary);
		text-align: center;
		padding: 1rem;
		font-family: var(--font-handwritten);
		box-sizing: border-box;
		overflow-y: auto;
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
