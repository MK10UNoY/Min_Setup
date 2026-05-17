<script lang="ts">
	/**
	 * TerminalInput — stdin input field for the terminal.
	 */
	import { terminalStore } from '$lib/stores/terminalStore';

	let inputValue = $state($terminalStore.stdinValue);

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		inputValue = target.value;
		terminalStore.setStdin(target.value);
	}
</script>

<div class="terminal-input-container">
	<label class="stdin-label" for="stdin-input">stdin</label>
	<textarea
		id="stdin-input"
		class="stdin-textarea"
		value={inputValue}
		oninput={handleInput}
		placeholder="Program input (stdin)..."
		rows={2}
	></textarea>
</div>

<style>
	.terminal-input-container {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 6px 12px;
		border-top: 1px solid #2d2d2d;
		background: #1a1a2e;
	}

	.stdin-label {
		font-size: 11px;
		font-weight: 600;
		color: #4ec9b0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding-top: 6px;
		flex-shrink: 0;
	}

	.stdin-textarea {
		flex: 1;
		background: #0d1117;
		border: 1px solid #2d2d2d;
		border-radius: 4px;
		color: #d4d4d4;
		font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
		font-size: 12px;
		padding: 6px 10px;
		resize: vertical;
		min-height: 32px;
		max-height: 120px;
		outline: none;
		transition: border-color 0.15s;
	}

	.stdin-textarea:focus {
		border-color: #007acc;
	}

	.stdin-textarea::placeholder {
		color: #4e4e4e;
	}
</style>
