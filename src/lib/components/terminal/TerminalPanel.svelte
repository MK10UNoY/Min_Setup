<script lang="ts">
	/**
	 * TerminalPanel — bottom panel with tab system (Output, Terminal, Problems).
	 * Includes terminal output, stdin input, and execution status footer.
	 * Uses phosphor-svelte icons throughout.
	 */
	import TerminalOutput from './TerminalOutput.svelte';
	import TerminalInput from './TerminalInput.svelte';
	import { terminalStore, type TerminalTab } from '$lib/stores/terminalStore';
	import { executionStore } from '$lib/stores/executionStore';
	import { uiStore } from '$lib/stores/uiStore';
	import Eraser from 'phosphor-svelte/lib/Eraser';
	import CaretDown from 'phosphor-svelte/lib/CaretDown';
	import HourglassMedium from 'phosphor-svelte/lib/HourglassMedium';
	import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
	import XCircle from 'phosphor-svelte/lib/XCircle';
	import Timer from 'phosphor-svelte/lib/Timer';
	import Clock from 'phosphor-svelte/lib/Clock';
	import HardDrive from 'phosphor-svelte/lib/HardDrive';
	import Warning from 'phosphor-svelte/lib/Warning';

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
			{#if $executionStore.status === 'running'}
				<span class="status-icon running">
					<HourglassMedium size={14} />
				</span>
			{:else if $executionStore.status === 'success'}
				<span class="status-icon success">
					<CheckCircle size={14} weight="fill" />
				</span>
			{:else if $executionStore.status === 'error'}
				<span class="status-icon error">
					<XCircle size={14} weight="fill" />
				</span>
			{:else if $executionStore.status === 'timeout'}
				<span class="status-icon timeout">
					<Timer size={14} />
				</span>
			{/if}
			<button class="panel-btn" onclick={handleClear} title="Clear Output" aria-label="Clear Output">
				<Eraser size={14} />
			</button>
			<button class="panel-btn" onclick={handleToggle} title="Toggle Panel" aria-label="Toggle Panel">
				<CaretDown size={14} />
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
							<span class="problem-icon">
								<Warning size={13} weight="fill" />
							</span>
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
				<Clock size={11} />
				{$executionStore.currentResult.executionTime < 1000
					? `${$executionStore.currentResult.executionTime}ms`
					: `${($executionStore.currentResult.executionTime / 1000).toFixed(2)}s`}
			</span>
			{#if $executionStore.currentResult.memoryUsage}
				<span class="footer-item">
					<HardDrive size={11} />
					{$executionStore.currentResult.memoryUsage}
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
		background: var(--bg-paper);
		border-top: 3px solid var(--border-color);
		min-height: 0;
		height: 100%;
	}

	.terminal-tabs {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		background: var(--bg-paper);
		border-bottom: 2px solid var(--border-color);
		min-height: 38px;
	}

	.tabs-left {
		display: flex;
		gap: 4px;
	}

	.tabs-right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.terminal-tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border: 1.5px solid transparent;
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-handwritten);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.terminal-tab:hover {
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	.terminal-tab.active {
		color: var(--primary);
		background: var(--bg-card);
		border-color: var(--border-color);
		border-bottom-color: var(--bg-card);
		border-radius: 6px 6px 0 0;
		box-shadow: 2px 0 0 rgba(0,0,0,0.05);
	}

	.badge {
		background: var(--danger);
		color: #ffffff;
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 10px;
		font-weight: 700;
	}

	.panel-btn {
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

	.panel-btn:hover {
		background: var(--bg-card);
		border-color: var(--border-color);
		color: var(--text-primary);
		transform: rotate(-5deg);
	}

	.status-icon {
		display: flex;
		align-items: center;
		margin-right: 4px;
	}

	.status-icon.running { color: var(--secondary); }
	.status-icon.success { color: var(--success); }
	.status-icon.error { color: var(--danger); }
	.status-icon.timeout { color: var(--secondary); }

	.terminal-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
		background-color: var(--bg-card);
	}

	.terminal-footer {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 4px 12px;
		background: var(--bg-paper);
		border-top: 2px solid var(--border-color);
		font-family: var(--font-handwritten);
		font-size: 14px;
		color: var(--text-secondary);
	}

	.footer-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.exit-success {
		color: var(--success);
		font-weight: bold;
	}

	.exit-error {
		color: var(--danger);
		font-weight: bold;
	}

	.problems-tab {
		flex: 1;
		overflow-y: auto;
		padding: 8px 12px;
		font-family: var(--font-mono);
	}

	.problem-line {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 4px 0;
		font-size: 13px;
	}

	.problem-line pre {
		margin: 0;
		font-family: inherit;
		color: var(--danger);
		white-space: pre-wrap;
	}

	.problem-icon {
		color: var(--secondary);
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.no-problems {
		color: var(--success);
		font-size: 14px;
		font-family: var(--font-handwritten);
		padding: 8px 0;
	}
</style>
