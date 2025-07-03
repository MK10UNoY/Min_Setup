<script lang="ts">
  import Monaco from '$lib/Monaco.svelte';
  import { onMount } from 'svelte';

  let language: string = 'javascript';
  let code: string = '';
  let input: string = '';
  let output: string = '';
  let loading: boolean = false;
  let error: string = '';

  // Map language to Judge0 language_id
  const languageMap: Record<string, number> = {
    javascript: 63, // JavaScript (Node.js)
    python: 71,     // Python 3
    c: 50,          // C (GCC 9.2.0)
    cpp: 54,        // C++ (GCC 9.2.0)
    svelte: 63,     // Use JS for Svelte for now
    react: 63       // Use JS for React for now
  };

  const languages = [
    { name: 'JavaScript', id: 'javascript' },
    { name: 'React', id: 'react' },
    { name: 'Svelte', id: 'svelte' },
    { name: 'C', id: 'c' },
    { name: 'C++', id: 'cpp' },
    { name: 'Python', id: 'python' }
  ];

  // Default code templates
  const templates: Record<string, string> = {
    javascript: `console.log('Hello, world!');`,
    python: `print('Hello, world!')`,
    c: `#include <stdio.h>\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}`,
    cpp: `#include <iostream>\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}`,
    svelte: `// Svelte code runs in the browser, not Judge0.`,
    react: `// React code runs in the browser, not Judge0.`
  };

  onMount(() => {
    code = templates[language];
  });

  $: if (language && templates[language] && code === '') {
    code = templates[language];
  }

  async function runCode() {
    output = '';
    error = '';
    loading = true;
    if (language === 'svelte' || language === 'react') {
      output = 'Frontend code execution is not yet supported.';
      loading = false;
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageMap[language],
          stdin: input
        })
      });
      const data = await res.json();
      if (data.stdout) output = data.stdout;
      else if (data.stderr) output = data.stderr;
      else if (data.compile_output) output = data.compile_output;
      else output = 'No output.';
    } catch (e) {
      error = 'Failed to execute code.';
    } finally {
      loading = false;
    }
  }

  function handleEditorChange(val: string) {
    code = val;
  }
</script>

<div class="min-h-screen bg-gray-100 p-4">
  <header class="mb-4 text-2xl font-bold">Snippet Verse Dashboard</header>
  <div class="mb-2">
    <select class="border rounded p-2" bind:value={language} on:change={() => code = templates[language] || ''}>
      {#each languages as lang}
        <option value={lang.id}>{lang.name}</option>
      {/each}
    </select>
  </div>
  <div class="mb-2">
    <Monaco
      {language}
      value={code}
      theme="vs-dark"
      height="300px"
      onChange={handleEditorChange}
    />
  </div>
  <div class="mb-2">
    <textarea class="border rounded w-full p-2" rows={3} placeholder="Input (stdin)" bind:value={input}></textarea>
  </div>
  <div class="mb-2">
    <div class="border rounded bg-white p-2 min-h-[50px]">
      {#if loading}
        <span class="text-gray-400">Running...</span>
      {:else if error}
        <span class="text-red-600">{error}</span>
      {:else}
        {output || 'Output will appear here'}
      {/if}
    </div>
  </div>
  <button class="bg-blue-600 text-white px-4 py-2 rounded" on:click={runCode} disabled={loading}>
    {loading ? 'Running...' : 'Run'}
  </button>
</div> 