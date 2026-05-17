/**
 * Strip ANSI escape codes from terminal output.
 * Handles color codes, cursor movement, and other control sequences.
 */
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g;

export function stripAnsi(input: string): string {
	return input.replace(ANSI_REGEX, '');
}

/**
 * Strip ANSI codes and also normalize line endings to \n
 */
export function cleanOutput(input: string): string {
	return stripAnsi(input).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
