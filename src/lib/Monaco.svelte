<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let value: string = '';
  export let language: string = 'javascript';
  export let theme: string = 'vs-dark';
  export let options: any = {};
  export let height: string = '300px';
  export let onChange: (value: string) => void = () => {};

  let editorContainer: HTMLDivElement;
  let editor: any;
  let monaco: any;

  onMount(async () => {
    const monacoModule = await import('./monaco-setup');
    monaco = monacoModule.default;
    if (editorContainer) {
      editor = monaco.editor.create(editorContainer, {
        value,
        language,
        theme,
        ...options
      });
      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue());
      });
    }
  });

  $: if (editor && language && monaco) {
    monaco.editor.setModelLanguage(editor.getModel()!, language);
  }
  $: if (editor && value !== editor.getValue()) {
    editor.setValue(value);
  }

  onDestroy(() => {
    editor?.dispose();
  });
</script>

<div bind:this={editorContainer} style="width: 100%; {`height: ${height};`}"></div> 