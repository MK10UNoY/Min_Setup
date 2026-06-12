/**
 * Shared types for the C/C++ WASM runner.
 */

/** Result from compiling and running C/C++ code */
export interface CppRunResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}
