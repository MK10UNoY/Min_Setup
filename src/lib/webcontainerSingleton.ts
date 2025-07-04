import { WebContainer } from '@webcontainer/api';

let instance: WebContainer | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance;

  if (!window.crossOriginIsolated) {
    throw new Error('WebContainers require cross-origin isolation');
  }

  instance = await WebContainer.boot();
  return instance;
}

export function resetWebContainer() {
  instance = null;
} 