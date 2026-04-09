import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = window.Buffer || Buffer;
  // @ts-ignore
  window.global = window.global || window;
  // @ts-ignore
  window.process = window.process || { env: {} };
  
  // Fix for "Cannot set property fetch of #<Window> which has only a getter"
  // This is required for WalletConnect/Reown which tries to polyfill fetch
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn('Fetch polyfill error:', e);
  }
}
