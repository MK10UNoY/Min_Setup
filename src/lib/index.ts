/**
 * Library barrel export.
 * Re-exports stores, execution functions, and utilities.
 */
export { fileStore, allFilePaths } from './stores/fileStore';
export { editorStore, activeTab } from './stores/editorStore';
export { executionStore } from './stores/executionStore';
export { terminalStore } from './stores/terminalStore';
export { uiStore } from './stores/uiStore';
export { executeCode, cleanupRunners, getExecutionMode } from './execution/router';
export { stripAnsi, cleanOutput } from './utils/ansiStripper';
export { getFileType, getMonacoLanguage, getExecutionBackend, getLanguageGroup, LANGUAGE_GROUPS } from './utils/fileTypes';
