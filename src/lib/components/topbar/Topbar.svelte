<script lang="ts">
	/**
	 * Topbar — application header with logo, run button, format, reset, and controls.
	 * Uses phosphor-svelte icons throughout.
	 */
	import { editorStore } from '$lib/stores/editorStore';
	import { fileStore } from '$lib/stores/fileStore';
	import { executionStore } from '$lib/stores/executionStore';
	import { terminalStore } from '$lib/stores/terminalStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { executeCode, getExecutionMode } from '$lib/execution/router';

	import Play from 'phosphor-svelte/lib/Play';
	import List from 'phosphor-svelte/lib/List';
	import AppWindow from 'phosphor-svelte/lib/AppWindow';
	import Terminal from 'phosphor-svelte/lib/Terminal';
	import GearSix from 'phosphor-svelte/lib/GearSix';
	import Lightning from 'phosphor-svelte/lib/Lightning';
	import TextIndent from 'phosphor-svelte/lib/TextIndent';
	import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
	import CircleNotch from 'phosphor-svelte/lib/CircleNotch';
	import Sun from 'phosphor-svelte/lib/Sun';
	import Moon from 'phosphor-svelte/lib/Moon';

	interface Props {
		onformat?: () => void;
	}

	let { onformat }: Props = $props();

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
						: getExecutionMode(activeFilename) === 'wasm'
							? 'WASM'
							: '—'
			: '—'
	);

	async function handleRun() {
		if (!$editorStore.activeFilePath || isRunning) return;
		const file = $fileStore.files[$editorStore.activeFilePath];
		if (!file) return;

		if ($settingsStore.terminalClearOnRun) {
			terminalStore.clear();
		}

		const stdin = $terminalStore.stdinValue;
		await executeCode(file.content, file.name, stdin);
	}

	function handleReset() {
		if ($editorStore.activeFilePath) {
			editorStore.closeTab($editorStore.activeFilePath);
		}
	}

	function handleFormat() {
		onformat?.();
	}

	let activeTheme = $derived($settingsStore.theme);
	let isDark = $derived(
		activeTheme === 'dark' || 
		(activeTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
	);

	function toggleTheme() {
		settingsStore.updateSetting('theme', isDark ? 'light' : 'dark');
	}

	function handleKeydown(e: KeyboardEvent) {
		// Ctrl+Enter -> Run
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleRun();
		}
		// Ctrl+Shift+F -> Format
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
			e.preventDefault();
			handleFormat();
		}
		// Ctrl+B -> Toggle Sidebar
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
			e.preventDefault();
			uiStore.toggleSidebar();
		}
		// Ctrl+J -> Toggle Terminal
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
			e.preventDefault();
			uiStore.toggleTerminal();
		}
		// Ctrl+, -> Open Settings
		if ((e.ctrlKey || e.metaKey) && e.key === ',') {
			e.preventDefault();
			uiStore.toggleSettings();
		}
		// Ctrl+Shift+L -> Toggle Theme
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
			e.preventDefault();
			toggleTheme();
		}
		// Esc -> Close settings dialog
		if (e.key === 'Escape' && $uiStore.settingsOpen) {
			e.preventDefault();
			uiStore.setSettingsOpen(false);
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
			<List size={18} />
		</button>

		<div class="logo-group">
			<span class="logo-icon">
				<Lightning size={20} weight="fill" color="#facc15" />
			</span>
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
				<span class="spinner">
					<CircleNotch size={14} />
				</span>
				<span>Running...</span>
			{:else}
				<Play size={14} weight="fill" />
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
		<!-- Format button -->
		<button
			class="topbar-btn"
			onclick={handleFormat}
			title="Format Document (Ctrl+Shift+F)"
			aria-label="Format Document"
			disabled={!$editorStore.activeFilePath}
		>
			<TextIndent size={16} />
		</button>

		<!-- Reset / close active tab -->
		<button
			class="topbar-btn"
			onclick={handleReset}
			title="Close Active Tab"
			aria-label="Close Active Tab"
			disabled={!$editorStore.activeFilePath}
		>
			<ArrowCounterClockwise size={16} />
		</button>

		<button
			class="topbar-btn"
			onclick={() => uiStore.togglePreview()}
			class:active-toggle={$uiStore.previewOpen}
			title="Toggle Preview"
			aria-label="Toggle Preview"
		>
			<AppWindow size={16} />
		</button>

		<button
			class="topbar-btn"
			onclick={() => uiStore.toggleTerminal()}
			class:active-toggle={$uiStore.terminalOpen}
			title="Toggle Terminal"
			aria-label="Toggle Terminal"
		>
			<Terminal size={16} />
		</button>

		<!-- Theme toggle -->
		<button
			class="topbar-btn"
			onclick={toggleTheme}
			title="Toggle Theme (Ctrl+Shift+L)"
			aria-label="Toggle Theme"
		>
			{#if isDark}
				<Sun size={16} />
			{:else}
				<Moon size={16} />
			{/if}
		</button>

		<!-- Settings button -->
		<button
			class="topbar-btn"
			onclick={() => uiStore.toggleSettings()}
			class:active-toggle={$uiStore.settingsOpen}
			title="Settings (Ctrl+,)"
			aria-label="Settings"
		>
			<GearSix size={16} />
		</button>
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--topbar-height);
		background: var(--bg-paper);
		border-bottom: 2px solid var(--border-color);
		padding: 0 16px;
		gap: 12px;
		z-index: 10;
	}

	.topbar-left,
	.topbar-center,
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 10px;
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
		display: flex;
		align-items: center;
	}

	.logo-text {
		font-family: var(--font-handwritten);
		font-size: 20px;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: 0.5px;
	}

	@media (max-width: 640px) {
		.logo-text {
			display: none;
		}
	}

	.run-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 18px;
		border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
		border: 2px solid var(--border-color);
		background: var(--success);
		color: var(--text-primary);
		font-family: var(--font-handwritten);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 3px 3px 0 var(--border-color);
	}

	.run-button:hover:not(:disabled) {
		transform: translate(-1px, -1px) rotate(-1deg);
		box-shadow: 4px 4px 0 var(--border-color);
		filter: brightness(1.05);
	}

	.run-button:active:not(:disabled) {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 var(--border-color);
	}

	.run-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}

	.spinner {
		display: flex;
		align-items: center;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.backend-badge {
		font-family: var(--font-handwritten);
		font-size: 13px;
		font-weight: bold;
		padding: 2px 8px;
		border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
		border: 1.5px solid var(--border-color);
		background: var(--bg-card);
		color: var(--primary);
		box-shadow: 1.5px 1.5px 0 var(--border-color);
	}

	.topbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 2px solid transparent;
		border-radius: 8px;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		padding: 0;
	}

	.topbar-btn:hover:not(:disabled) {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--text-primary);
		transform: rotate(2deg) scale(1.05);
		box-shadow: 2px 2px 0 var(--border-color);
	}

	.topbar-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.topbar-btn.active-toggle {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--primary);
		box-shadow: 2px 2px 0 var(--border-color);
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
