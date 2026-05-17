/**
 * Nodebox runner — executes JS/TS code in the browser via @codesandbox/nodebox.
 * No server needed. Runs entirely client-side.
 */
import type { ExecutionEngine, ExecutionRequest, ExecutionResponse } from './types';
import { cleanOutput } from '$lib/utils/ansiStripper';

// Type declarations for Nodebox since the package has limited TS types
interface NodeboxShell {
	stdout: { on(event: 'data', cb: (data: string) => void): void };
	stderr: { on(event: 'data', cb: (data: string) => void): void };
	stdin: { write(data: string): void };
	on(event: 'exit', cb: (code: number) => void): void;
	runCommand(bin: string, args: string[]): Promise<{ id: string }>;
	kill(): Promise<void>;
}

interface NodeboxInstance {
	connect(): Promise<void>;
	fs: {
		init(files: Record<string, string>): Promise<void>;
	};
	shell: {
		create(): NodeboxShell;
	};
}

let nodeboxInstance: NodeboxInstance | null = null;
let nodeboxIframe: HTMLIFrameElement | null = null;

async function getNodebox(): Promise<NodeboxInstance> {
	if (nodeboxInstance) return nodeboxInstance;

	// Create a hidden iframe for Nodebox runtime
	if (!nodeboxIframe) {
		nodeboxIframe = document.createElement('iframe');
		nodeboxIframe.id = 'nodebox-runtime-frame';
		nodeboxIframe.style.cssText = 'width:0;height:0;border:none;position:absolute;left:-9999px;';
		document.body.appendChild(nodeboxIframe);
	}

	const { Nodebox } = await import('@codesandbox/nodebox');
	nodeboxInstance = new Nodebox({
		iframe: nodeboxIframe
	}) as unknown as NodeboxInstance;

	await nodeboxInstance.connect();
	return nodeboxInstance;
}

export class NodeboxRunner implements ExecutionEngine {
	async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
		const startTime = performance.now();

		try {
			const nodebox = await getNodebox();

			// Determine filename based on language
			const filename = request.language === 'typescript' ? 'index.ts' : 'index.js';

			// Mount the file system
			await nodebox.fs.init({
				[filename]: request.code
			});

			const shell = nodebox.shell.create();

			let stdout = '';
			let stderr = '';
			let exitCode = 0;

			// Collect output
			shell.stdout.on('data', (data: string) => {
				stdout += data;
			});

			shell.stderr.on('data', (data: string) => {
				stderr += data;
			});

			// Set up exit handler
			const exitPromise = new Promise<number>((resolve) => {
				shell.on('exit', (code: number) => {
					resolve(code);
				});
			});

			// Run the command
			if (request.language === 'typescript') {
				// Use npx tsx for TypeScript
				await shell.runCommand('npx', ['-y', 'tsx', filename]);
			} else {
				await shell.runCommand('node', [filename]);
			}

			// Write stdin if provided
			if (request.stdin) {
				shell.stdin.write(request.stdin + '\n');
			}

			// Wait for exit with timeout
			const timeoutPromise = new Promise<number>((_, reject) =>
				setTimeout(() => reject(new Error('Execution timed out (10s limit)')), 10000)
			);

			try {
				exitCode = await Promise.race([exitPromise, timeoutPromise]);
			} catch (err) {
				try {
					await shell.kill();
				} catch {
					// Shell may already be dead
				}
				const elapsed = performance.now() - startTime;
				return {
					stdout: cleanOutput(stdout),
					stderr: 'Execution timed out (10s limit)',
					exitCode: 1,
					executionTime: Math.round(elapsed),
					memoryUsage: null
				};
			}

			const elapsed = performance.now() - startTime;

			return {
				stdout: cleanOutput(stdout),
				stderr: cleanOutput(stderr),
				exitCode,
				executionTime: Math.round(elapsed),
				memoryUsage: null
			};
		} catch (err: unknown) {
			const elapsed = performance.now() - startTime;
			const message = err instanceof Error ? err.message : String(err);
			return {
				stdout: '',
				stderr: `Nodebox error: ${message}`,
				exitCode: 1,
				executionTime: Math.round(elapsed),
				memoryUsage: null
			};
		}
	}

	async isAvailable(): Promise<boolean> {
		// Nodebox works in any modern browser — no special headers needed
		return typeof window !== 'undefined';
	}

	cleanup(): void {
		if (nodeboxIframe) {
			nodeboxIframe.remove();
			nodeboxIframe = null;
		}
		nodeboxInstance = null;
	}
}
