/**
 * Execution state store — tracks running processes and results.
 */
import { writable } from 'svelte/store';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout';

export interface ExecutionResult {
	stdout: string;
	stderr: string;
	exitCode: number | null;
	executionTime: number; // ms
	memoryUsage: string | null;
	language: string;
	status: ExecutionStatus;
}

export interface ExecutionStoreState {
	status: ExecutionStatus;
	currentResult: ExecutionResult | null;
	history: ExecutionResult[];
}

const EMPTY_RESULT: ExecutionResult = {
	stdout: '',
	stderr: '',
	exitCode: null,
	executionTime: 0,
	memoryUsage: null,
	language: '',
	status: 'idle'
};

function createExecutionStore() {
	const { subscribe, update, set } = writable<ExecutionStoreState>({
		status: 'idle',
		currentResult: null,
		history: []
	});

	return {
		subscribe,

		startExecution(language: string) {
			update((state) => {
				state.status = 'running';
				state.currentResult = { ...EMPTY_RESULT, language, status: 'running' };
				return state;
			});
		},

		completeExecution(result: Omit<ExecutionResult, 'status'>) {
			update((state) => {
				const fullResult: ExecutionResult = {
					...result,
					status: result.exitCode === 0 ? 'success' : 'error'
				};
				state.status = fullResult.status;
				state.currentResult = fullResult;
				state.history = [fullResult, ...state.history].slice(0, 50);
				return state;
			});
		},

		setError(errorMessage: string, language: string) {
			update((state) => {
				const result: ExecutionResult = {
					...EMPTY_RESULT,
					stderr: errorMessage,
					language,
					status: 'error'
				};
				state.status = 'error';
				state.currentResult = result;
				state.history = [result, ...state.history].slice(0, 50);
				return state;
			});
		},

		setTimeout(language: string) {
			update((state) => {
				const result: ExecutionResult = {
					...EMPTY_RESULT,
					stderr: 'Execution timed out (10s limit)',
					language,
					status: 'timeout'
				};
				state.status = 'timeout';
				state.currentResult = result;
				state.history = [result, ...state.history].slice(0, 50);
				return state;
			});
		},

		reset() {
			set({ status: 'idle', currentResult: null, history: [] });
		}
	};
}

export const executionStore = createExecutionStore();
