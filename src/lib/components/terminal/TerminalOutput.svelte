<script lang="ts">
	/**
	 * TerminalOutput — renders terminal lines with color-coded types.
	 * Auto-scrolls to the bottom on new output.
	 */
	import { terminalStore, type TerminalLine } from '$lib/stores/terminalStore';
	import { tick } from 'svelte';

	let scrollContainer: HTMLDivElement;

	// Auto-scroll when lines change
	$effect(() => {
		const _lines = $terminalStore.lines;
		void _lines;
		tick().then(() => {
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		});
	});

	function getLineClass(line: TerminalLine): string {
		switch (line.type) {
			case 'stderr': return 'line-stderr';
			case 'system': return 'line-system';
			case 'stdin': return 'line-stdin';
			default: return 'line-stdout';
		}
	}
</script>

<div class="terminal-output" bind:this={scrollContainer}>
	{#if $terminalStore.lines.length === 0}
		<div class="terminal-empty">
			<span class="terminal-prompt">$</span>
			<span class="terminal-hint">Press Run or Ctrl+Enter to execute code</span>
		</div>
	{:else}
		{#each $terminalStore.lines as line, i (i)}
			<div class="terminal-line {getLineClass(line)}">
				<pre>{line.text}</pre>
			</div>
		{/each}
	{/if}
</div>

<style>
	.terminal-output {
		flex: 1;
		overflow-y: auto;
		overflow-x: auto;
		padding: 10px 16px;
		font-family: var(--font-mono);
		font-size: var(--terminal-font-size);
		line-height: 1.5;
		background: var(--bg-card);
	}

	.terminal-output::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.terminal-output::-webkit-scrollbar-track {
		background: transparent;
	}

	.terminal-output::-webkit-scrollbar-thumb {
		background: rgba(45, 45, 45, 0.2);
		border-radius: 3px;
	}

	:global(html[data-theme="dark"]) .terminal-output::-webkit-scrollbar-thumb {
		background: rgba(244, 244, 245, 0.2);
	}

	.terminal-line {
		min-height: 18px;
	}

	.terminal-line pre {
		margin: 0;
		padding: 0;
		font: inherit;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.line-stdout pre {
		color: var(--text-primary);
	}

	.line-stderr pre {
		color: var(--danger);
		font-weight: 500;
	}

	.line-system pre {
		color: var(--primary);
		font-style: italic;
	}

	.line-stdin pre {
		color: var(--secondary);
	}

	.terminal-empty {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-muted);
		padding: 4px 0;
	}

	.terminal-prompt {
		color: var(--success);
		font-weight: 700;
		font-size: 14px;
	}

	.terminal-hint {
		color: var(--text-muted);
		font-family: var(--font-handwritten);
		font-size: 16px;
	}
</style>
