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
		border-top: 2px solid var(--border-color);
		background: var(--bg-paper);
	}

	.stdin-label {
		font-family: var(--font-handwritten);
		font-size: 15px;
		font-weight: 700;
		color: var(--success);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding-top: 6px;
		flex-shrink: 0;
	}

	.stdin-textarea {
		flex: 1;
		background: var(--bg-card);
		border: 2px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 13px;
		padding: 6px 10px;
		resize: vertical;
		min-height: 32px;
		max-height: 120px;
		outline: none;
		transition: all 0.15s ease;
	}

	.stdin-textarea:focus {
		border-color: var(--primary);
		transform: scale(1.005);
	}

	.stdin-textarea::placeholder {
		color: var(--text-muted);
	}
</style>
