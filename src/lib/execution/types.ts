/**
 * Shared types for the execution layer.
 * Safe to import from both client and server code.
 */

/** Language metadata returned by GET /api/languages */
export interface LanguageInfo {
	id: number;
	name: string;
	extension: string;
	mode: 'judge0' | 'nodebox' | 'iframe' | 'wasm';
}

/** Request shape for code execution */
export interface ExecuteRequest {
	code: string;
	languageId: number;
	stdin: string;
	filename: string;
}

/** Normalized response from all execution backends */
export interface ExecuteResponse {
	success: boolean;
	stdout: string;
	stderr: string;
	compile_output: string;
	status: {
		id: number;
		description: string;
	};
	time: string;
	memory: string;
	executionMode: 'judge0' | 'nodebox' | 'iframe' | 'wasm';
}

/** Internal request used by the NodeboxRunner */
export interface ExecutionRequest {
	code: string;
	language: string;
	stdin: string;
	filename: string;
}

/** Internal response used by the NodeboxRunner */
export interface ExecutionResponse {
	stdout: string;
	stderr: string;
	exitCode: number;
	executionTime: number;
	memoryUsage: string | null;
	compileOutput?: string;
}

/** Engine interface for the strategy pattern */
export interface ExecutionEngine {
	execute(request: ExecutionRequest): Promise<ExecutionResponse>;
	isAvailable(): Promise<boolean>;
	cleanup?(): void;
}
