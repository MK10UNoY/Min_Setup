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
		padding: 8px 12px;
		font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
		font-size: 12.5px;
		line-height: 1.5;
		background: #1a1a2e;
	}

	.terminal-output::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.terminal-output::-webkit-scrollbar-track {
		background: transparent;
	}

	.terminal-output::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
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
		color: #d4d4d4;
	}

	.line-stderr pre {
		color: #f44747;
	}

	.line-system pre {
		color: #569cd6;
		font-style: italic;
	}

	.line-stdin pre {
		color: #dcdcaa;
	}

	.terminal-empty {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #5e5e5e;
		padding: 4px 0;
	}

	.terminal-prompt {
		color: #4ec9b0;
		font-weight: 600;
	}

	.terminal-hint {
		color: #5e5e5e;
	}
</style>
