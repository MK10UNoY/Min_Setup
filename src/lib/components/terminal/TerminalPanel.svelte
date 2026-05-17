<script lang="ts">
	/**
	 * TerminalPanel — bottom panel with tab system (Output, Terminal, Problems).
	 * Includes terminal output, stdin input, and execution status footer.
	 */
	import TerminalOutput from './TerminalOutput.svelte';
	import TerminalInput from './TerminalInput.svelte';
	import { terminalStore, type TerminalTab } from '$lib/stores/terminalStore';
	import { executionStore } from '$lib/stores/executionStore';
	import { uiStore } from '$lib/stores/uiStore';

	const tabs: { id: TerminalTab; label: string }[] = [
		{ id: 'output', label: 'Output' },
		{ id: 'terminal', label: 'Terminal' },
		{ id: 'problems', label: 'Problems' }
	];

	function handleClear() {
		terminalStore.clear();
	}

	function handleToggle() {
		uiStore.toggleTerminal();
	}

	let errorCount = $derived(
		$terminalStore.lines.filter((l) => l.type === 'stderr').length
	);

	let statusIcon = $derived(
		$executionStore.status === 'running' ? '⏳' :
		$executionStore.status === 'success' ? '✅' :
		$executionStore.status === 'error' ? '❌' :
		$executionStore.status === 'timeout' ? '⏰' : ''
	);
</script>

<div class="terminal-panel">
	<!-- Tab bar -->
	<div class="terminal-tabs">
		<div class="tabs-left">
			{#each tabs as tab (tab.id)}
				<button
					class="terminal-tab"
					class:active={$terminalStore.activeTab === tab.id}
					onclick={() => terminalStore.setActiveTab(tab.id)}
				>
					{tab.label}
					{#if tab.id === 'problems' && errorCount > 0}
						<span class="badge">{errorCount}</span>
					{/if}
				</button>
			{/each}
		</div>
		<div class="tabs-right">
			{#if statusIcon}
				<span class="status-icon">{statusIcon}</span>
			{/if}
			<button class="panel-btn" onclick={handleClear} title="Clear Output">
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
			</button>
			<button class="panel-btn" onclick={handleToggle} title="Toggle Panel">
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M4 10l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="terminal-content">
		{#if $terminalStore.activeTab === 'output'}
			<TerminalOutput />
		{:else if $terminalStore.activeTab === 'terminal'}
			<TerminalOutput />
			<TerminalInput />
		{:else}
			<div class="problems-tab">
				{#if errorCount > 0}
					{#each $terminalStore.lines.filter((l) => l.type === 'stderr') as errLine}
						<div class="problem-line">
							<span class="problem-icon">⚠</span>
							<pre>{errLine.text}</pre>
						</div>
					{/each}
				{:else}
					<div class="no-problems">No problems detected.</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Status footer -->
	{#if $executionStore.currentResult}
		<div class="terminal-footer">
			<span class="footer-item">
				{$executionStore.currentResult.language}
			</span>
			<span class="footer-item">
				⏱ {$executionStore.currentResult.executionTime < 1000
					? `${$executionStore.currentResult.executionTime}ms`
					: `${($executionStore.currentResult.executionTime / 1000).toFixed(2)}s`}
			</span>
			{#if $executionStore.currentResult.memoryUsage}
				<span class="footer-item">
					💾 {$executionStore.currentResult.memoryUsage}
				</span>
			{/if}
			<span class="footer-item" class:exit-success={$executionStore.currentResult.exitCode === 0} class:exit-error={$executionStore.currentResult.exitCode !== 0}>
				Exit: {$executionStore.currentResult.exitCode ?? '?'}
			</span>
		</div>
	{/if}
</div>

<style>
	.terminal-panel {
		display: flex;
		flex-direction: column;
		background: #1a1a2e;
		border-top: 2px solid #007acc;
		min-height: 0;
		height: 100%;
	}

	.terminal-tabs {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8px;
		background: #1e1e2e;
		border-bottom: 1px solid #2d2d2d;
		min-height: 34px;
	}

	.tabs-left {
		display: flex;
		gap: 0;
	}

	.tabs-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.terminal-tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border: none;
		background: transparent;
		color: #808080;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s;
		font-family: inherit;
		border-bottom: 2px solid transparent;
	}

	.terminal-tab:hover {
		color: #cccccc;
	}

	.terminal-tab.active {
		color: #ffffff;
		border-bottom-color: #007acc;
	}

	.badge {
		background: #f44747;
		color: #ffffff;
		font-size: 10px;
		padding: 1px 5px;
		border-radius: 8px;
		font-weight: 600;
	}

	.panel-btn {
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

	.panel-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #cccccc;
	}

	.status-icon {
		font-size: 13px;
		margin-right: 4px;
	}

	.terminal-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.terminal-footer {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 4px 12px;
		background: #16161e;
		border-top: 1px solid #2d2d2d;
		font-size: 11px;
		color: #808080;
	}

	.footer-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.exit-success {
		color: #4ec9b0;
	}

	.exit-error {
		color: #f44747;
	}

	.problems-tab {
		flex: 1;
		overflow-y: auto;
		padding: 8px 12px;
	}

	.problem-line {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 4px 0;
		font-size: 12px;
	}

	.problem-line pre {
		margin: 0;
		font-family: inherit;
		color: #f44747;
		white-space: pre-wrap;
	}

	.problem-icon {
		color: #f4c747;
		flex-shrink: 0;
	}

	.no-problems {
		color: #4ec9b0;
		font-size: 12px;
		padding: 8px 0;
	}
</style>
