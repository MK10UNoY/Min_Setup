<script lang="ts">
	/**
	 * Topbar — application header with logo, run button, controls.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore } from '$lib/stores/fileStore';
	import { executionStore } from '$lib/stores/executionStore';
	import { terminalStore } from '$lib/stores/terminalStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { executeCode, getExecutionMode } from '$lib/execution/router';

	let isRunning = $derived($executionStore.status === 'running');

	let activeFilename = $derived(
		$editorStore.activeFilePath
			? $editorStore.activeFilePath.split('/').pop() || ''
			: ''
	);

	let canRun = $derived(
		$editorStore.activeFilePath !== null &&
		getExecutionMode(activeFilename) !== 'none'
	);

	let backendLabel = $derived(
		activeFilename
			? getExecutionMode(activeFilename) === 'nodebox'
				? 'Nodebox'
				: getExecutionMode(activeFilename) === 'judge0'
					? 'Judge0'
					: getExecutionMode(activeFilename) === 'iframe'
						? 'Preview'
						: '—'
			: '—'
	);

	async function handleRun() {
		if (!$editorStore.activeFilePath || isRunning) return;
		const file = $fileStore.files[$editorStore.activeFilePath];
		if (!file) return;

		const stdin = $terminalStore.stdinValue;
		await executeCode(file.content, file.name, stdin);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleRun();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="topbar">
	<div class="topbar-left">
		<!-- Sidebar toggle for mobile -->
		<button
			class="topbar-btn sidebar-toggle"
			onclick={() => uiStore.toggleSidebar()}
			title="Toggle Sidebar"
			aria-label="Toggle Sidebar"
		>
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
				<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>

		<div class="logo-group">
			<span class="logo-icon">⚡</span>
			<span class="logo-text">Low Setup Guru</span>
		</div>
	</div>

	<div class="topbar-center">
		<button
			class="run-button"
			onclick={handleRun}
			disabled={!canRun || isRunning}
			title="Run (Ctrl+Enter)"
		>
			{#if isRunning}
				<span class="spinner"></span>
				<span>Running...</span>
			{:else}
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M4 2l10 6-10 6V2z" fill="currentColor"/>
				</svg>
				<span>Run</span>
			{/if}
		</button>

		{#if activeFilename}
			<span class="backend-badge" title="Execution backend">
				{backendLabel}
			</span>
		{/if}
	</div>

	<div class="topbar-right">
		<button
			class="topbar-btn"
			onclick={() => uiStore.togglePreview()}
			class:active-toggle={$uiStore.previewOpen}
			title="Toggle Preview"
			aria-label="Toggle Preview"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
				<path d="M1 5h14" stroke="currentColor" stroke-width="1.2"/>
				<circle cx="3.5" cy="3.5" r="0.7" fill="#f44747"/>
				<circle cx="5.5" cy="3.5" r="0.7" fill="#f4c747"/>
				<circle cx="7.5" cy="3.5" r="0.7" fill="#4ec9b0"/>
			</svg>
		</button>

		<button
			class="topbar-btn"
			onclick={() => uiStore.toggleTerminal()}
			class:active-toggle={$uiStore.terminalOpen}
			title="Toggle Terminal"
			aria-label="Toggle Terminal"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M2 12l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M8 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>

		<button class="topbar-btn" title="Settings" aria-label="Settings">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2"/>
				<path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
			</svg>
		</button>
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 44px;
		background: #16161e;
		border-bottom: 1px solid #2d2d2d;
		padding: 0 12px;
		gap: 12px;
		z-index: 10;
	}

	.topbar-left,
	.topbar-center,
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.topbar-left {
		flex: 0 0 auto;
	}

	.topbar-center {
		flex: 1;
		justify-content: center;
	}

	.topbar-right {
		flex: 0 0 auto;
	}

	.logo-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.logo-icon {
		font-size: 20px;
	}

	.logo-text {
		font-size: 14px;
		font-weight: 600;
		color: #e0e0e0;
		letter-spacing: 0.3px;
	}

	@media (max-width: 640px) {
		.logo-text {
			display: none;
		}
	}

	.run-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 20px;
		border-radius: 6px;
		border: none;
		background: linear-gradient(135deg, #10b981, #059669);
		color: #ffffff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}

	.run-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #34d399, #10b981);
		box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
		transform: translateY(-1px);
	}

	.run-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.run-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.backend-badge {
		font-size: 10px;
		padding: 2px 8px;
		border-radius: 10px;
		background: rgba(0, 122, 204, 0.2);
		color: #569cd6;
		font-weight: 500;
		letter-spacing: 0.3px;
	}

	.topbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: #808080;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		padding: 0;
	}

	.topbar-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #cccccc;
	}

	.topbar-btn.active-toggle {
		background: rgba(0, 122, 204, 0.15);
		color: #569cd6;
	}

	.sidebar-toggle {
		display: none;
	}

	@media (max-width: 768px) {
		.sidebar-toggle {
			display: flex;
		}
	}
</style>
