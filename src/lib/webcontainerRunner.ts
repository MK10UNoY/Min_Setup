import { WebContainer } from '@webcontainer/api';

export async function runJS(code: string, stdin: string = '', webcontainer?: WebContainer): Promise<string> {
  if (!webcontainer) {
    console.log('[WebContainer] Booting (from runJS)...');
    webcontainer = await WebContainer.boot();
    console.log('[WebContainer] Booted (from runJS)!');
  }
  console.log('[WebContainer] Mounting code...');
  await webcontainer.mount({
    'index.js': { file: { contents: code } }
  });
  console.log('[WebContainer] Spawning process...');
  const process = await webcontainer.spawn('node', ['index.js']);
  let output = '';
  let errorOutput = '';
  const outReader = process.output.getReader();
  // Only read stderr if it exists
  const errReader = (process as any).stderr?.getReader ? (process as any).stderr.getReader() : null;

  // Read stdout
  const readOutput = (async () => {
    while (true) {
      const { value, done } = await outReader.read();
      if (done) break;
      output += value;
    }
  })();

  // Read stderr if available
  const readError = errReader
    ? (async () => {
        while (true) {
          const { value, done } = await errReader.read();
          if (done) break;
          errorOutput += value;
        }
      })()
    : Promise.resolve();

  // Wait for process to exit
  const exitPromise = process.exit;

  // Add a timeout (e.g., 10 seconds)
  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('Execution timed out')), 10000)
  );

  const runPromise = (async () => {
    await Promise.all([readOutput, readError, exitPromise]);
    console.log(`[WebContainer] Exited with code ${await exitPromise}`);
    if (errorOutput) console.error(`[WebContainer] STDERR: ${errorOutput}`);
    const result = output || errorOutput || 'No output.';
    console.log('[WebContainer] Output:', result);
    return result;
  })();

  return Promise.race([runPromise, timeoutPromise]);
} 