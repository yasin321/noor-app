import { useEffect, useRef } from 'react';

type BackEntry = {
  id: number;
  handler: () => boolean;
};

let nextEntryId = 1;
const stack: BackEntry[] = [];

export function registerBackHandler(handler: () => boolean): () => void {
  const id = nextEntryId++;
  stack.push({ id, handler });
  return () => {
    const idx = stack.findIndex((e) => e.id === id);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

export function dispatchBackPress(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    try {
      if (stack[i].handler()) {
        return true;
      }
    } catch {
      // ادامه به هندلر بعدی
    }
  }
  return false;
}

export function clearAllBackHandlersForTest(): void {
  stack.length = 0;
}

export function useBackHandler(active: boolean, onBack: () => void): void {
  const cbRef = useRef(onBack);
  cbRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    return registerBackHandler(() => {
      cbRef.current();
      return true;
    });
  }, [active]);
}

declare global {
  interface Window {
    __noorHandleNativeBack?: () => boolean;
  }
}

if (typeof window !== 'undefined') {
  window.__noorHandleNativeBack = () => dispatchBackPress();
}
