<script lang="ts">
  import Monaco from '$lib/Monaco.svelte';
  import { onMount } from 'svelte';
  import { runJS } from '$lib/webcontainerRunner';
  import { WebContainer } from '@webcontainer/api';
  import { getWebContainer } from '$lib/webcontainerSingleton';

  let language: string = 'javascript';
  let code: string = '';
  let input: string = '';
  let output: string = '';
  let loading: boolean = false;
  let error: string = '';
  let webcontainerStatus: string = '';
  let sidebarOpen: boolean = false;

  let webcontainer: WebContainer | null = null;

  // Map language to Judge0 language_id
  const languageMap: Record<string, number> = {
    javascript: 63, // JavaScript (Node.js)
    python: 71,     // Python 3
    c: 50,          // C (GCC 9.2.0)
    cpp: 54,        // C++ (GCC 9.2.0)
    svelte: 63,     // Use JS for Svelte for now
    react: 63,      // Use JS for React for now
    typescript: 74  // TypeScript (Judge0)
  };

  const languages = [
    { name: 'JavaScript', id: 'javascript' },
    { name: 'TypeScript', id: 'typescript' },
    { name: 'React', id: 'react' },
    { name: 'Svelte', id: 'svelte' },
    { name: 'C', id: 'c' },
    { name: 'C++', id: 'cpp' },
    { name: 'Python', id: 'python' }
  ];

  // Default code templates
  const templates: Record<string, string> = {
    javascript: `console.log('Hello, world!');`,
    typescript: `console.log('Hello, TypeScript!');`,
    python: `print('Hello, world!')`,
    c: `#include <stdio.h>\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}`,
    cpp: `#include <iostream>\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}`,
    svelte: `// Svelte code runs in the browser, not Judge0.`,
    react: `// React code runs in the browser, not Judge0.`
  };

  onMount(async () => {
    code = templates[language];
    if (!window.crossOriginIsolated) {
      webcontainerStatus = 'WebContainers require cross-origin isolation. Please ensure your dev server is sending the correct headers.';
    } else {
      webcontainerStatus = 'WebContainers are enabled! JS/TS/Svelte/React will run in-browser.';
      // Preload and reuse singleton
      console.log('[WebContainer] Preloading singleton...');
      webcontainer = await getWebContainer();
      console.log('[WebContainer] Singleton ready!');
    }
  });

  $: if (language && templates[language] && code === '') {
    code = templates[language];
  }

  async function runCode() {
    output = '';
    error = '';
    loading = true;
    if (["javascript", "typescript", "svelte", "react"].includes(language)) {
      if (!window.crossOriginIsolated) {
        error = 'WebContainers require cross-origin isolation. Please check your server headers.';
        loading = false;
        return;
      }
      try {
        // Always use the singleton loader
        webcontainer = await getWebContainer();
        console.log('[WebContainer] Running code...');
        output = await runJS(code, input, webcontainer ?? undefined);
        console.log('[WebContainer] Code run complete. Output:', output);
      } catch (e: any) {
        error = 'WebContainer error: ' + (e.message || e);
        console.error('[WebContainer] Error:', e);
      } finally {
        loading = false;
      }
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

<div class="flex h-screen bg-[#1e1e1e]">
  <!-- Sidebar (mobile toggle) -->
  <aside class="fixed md:static z-20 top-0 left-0 h-full w-56 md:w-14 bg-[#23272e] flex flex-col items-center py-4 space-y-4 border-r border-[#222] transition-transform duration-200 md:translate-x-0"
    class:translate-x-0={sidebarOpen} class:-translate-x-full={!sidebarOpen && !window.matchMedia('(min-width: 768px)').matches}>
    <button class="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white" on:click={() => sidebarOpen = false} title="Close Sidebar">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
    <button class="text-gray-400 hover:text-white" title="Explorer">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16"/></svg>
    </button>
    <button class="text-gray-400 hover:text-white" title="Run">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="8,5 19,12 8,19"/></svg>
    </button>
    <button class="text-gray-400 hover:text-white" title="Settings">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </aside>

  <!-- Mobile sidebar toggle button -->
  <button class="md:hidden fixed top-4 left-4 z-30 bg-[#23272e] text-white p-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => sidebarOpen = true} title="Open Sidebar">
    <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
  </button>

  <!-- Main Area -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Top Bar -->
    <header class="h-12 bg-[#23272e] flex items-center px-4 md:px-6 border-b border-[#222] justify-between">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold text-gray-200 tracking-wide">Low Setup Guru</span>
        <span class="ml-2 text-xs text-gray-400 bg-[#2d2d2d] px-2 py-1 rounded hidden sm:inline">VSCode Mode</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">{language}</span>
      </div>
    </header>

    <!-- WebContainers Status -->
    {#if webcontainerStatus}
      <div class="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm border-b border-yellow-300">{webcontainerStatus}</div>
    {/if}

    <!-- Editor and Controls -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <div class="flex-1 flex flex-col p-2 md:p-4 gap-4 min-w-0">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-2">
          <select class="bg-[#23272e] text-gray-200 border border-[#333] rounded px-3 py-2 focus:outline-none w-full sm:w-auto" bind:value={language} on:change={() => code = templates[language] || ''}>            {#each languages as lang}
              <option value={lang.id}>{lang.name}</option>
            {/each}
          </select>
          <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow text-base font-semibold w-full sm:w-auto" on:click={runCode} disabled={loading}>
            {loading ? 'Running...' : 'Run'}
          </button>
        </div>
        <div class="flex-1 min-h-0 rounded-lg overflow-hidden border border-[#23272e] shadow-lg">
          <Monaco
            {language}
            value={code}
            theme="vs-dark"
            height="300px"
            onChange={handleEditorChange}
          />
        </div>
        <div class="flex flex-col md:flex-row gap-4 mt-2">
          <textarea class="bg-[#23272e] text-gray-200 border border-[#333] rounded w-full p-2 text-base resize-y min-h-[48px]" rows={3} placeholder="Input (stdin)" bind:value={input}></textarea>
          <div class="bg-[#181a1b] text-gray-100 border border-[#333] rounded w-full p-2 min-h-[48px] text-base overflow-x-auto">
            {#if loading}
              <span class="text-gray-400">Running...</span>
            {:else if error}
              <span class="text-red-400">{error}</span>
            {:else}
              {output || 'Output will appear here'}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 