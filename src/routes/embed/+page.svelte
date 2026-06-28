<script lang="ts">
	/**
	 * Embeddable version — minimal IDE for iframing into other sites.
	 * Usage: <iframe src="https://your-domain.com/embed"></iframe>
	 */
	import MonacoEditor from '$lib/components/editor/MonacoEditor.svelte';
	import TerminalOutput from '$lib/components/terminal/TerminalOutput.svelte';
	import { executeCode } from '$lib/execution/router';
	import { terminalStore } from '$lib/stores/terminalStore';
	import { executionStore } from '$lib/stores/executionStore';

	let code = $state(`// Low Setup Guru — Embedded Playground\nconsole.log("Hello, World!");\n`);
	let filename = $state('main.js');
	let isRunning = $derived($executionStore.status === 'running');

	async function handleRun() {
		await executeCode(code, filename, $terminalStore.stdinValue);
	}

	function handleEditorChange(newValue: string) {
		code = newValue;
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleRun();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Low Setup Guru — Embed</title>
</svelte:head>

<div class="embed-layout">
	<div class="embed-header">
		<span class="embed-logo">⚡ Low Setup Guru</span>
		<div class="embed-controls">
			<select class="embed-select" bind:value={filename}>
				<option value="main.js">JavaScript</option>
				<option value="index.ts">TypeScript</option>
				<option value="main.py">Python</option>
				<option value="main.c">C</option>
				<option value="main.cpp">C++</option>
				<option value="Main.java">Java</option>
			</select>
			<button class="embed-run" onclick={handleRun} disabled={isRunning}>
				{isRunning ? '⏳' : '▶'} Run
			</button>
		</div>
	</div>

	<div class="embed-editor">
		<MonacoEditor value={code} {filename} onchange={handleEditorChange} />
	</div>

	<div class="embed-output">
		<TerminalOutput />
	</div>
</div>

<style>
	.embed-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		background: #1e1e1e;
		overflow: hidden;
	}

	.embed-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 12px;
		background: #16161e;
		border-bottom: 1px solid #2d2d2d;
		min-height: 36px;
	}

	.embed-logo {
		font-size: 12px;
		font-weight: 600;
		color: #e0e0e0;
	}

	.embed-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.embed-select {
		background: #2d2d2d;
		border: 1px solid #404040;
		border-radius: 4px;
		color: #cccccc;
		font-size: 11px;
		padding: 3px 8px;
		outline: none;
		font-family: inherit;
	}

	.embed-run {
		padding: 4px 14px;
		border-radius: 4px;
		border: none;
		background: #10b981;
		color: #ffffff;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		font-family: inherit;
	}

	.embed-run:hover:not(:disabled) {
		background: #34d399;
	}

	.embed-run:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.embed-editor {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.embed-output {
		height: 30%;
		min-height: 80px;
		border-top: 2px solid #007acc;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
