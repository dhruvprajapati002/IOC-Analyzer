// Client-side crypto polyfill for browser environments
if (typeof window !== 'undefined') {
  // Browser environment
  if (!(window as any).crypto) {
    (window as any).crypto = {};
  }
  
  if (!(window as any).crypto.randomUUID) {
    (window as any).crypto.randomUUID = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    } as () => string;
  }
}

// Also ensure globalThis has crypto for universal access
if (typeof globalThis !== 'undefined') {
  if (!(globalThis as any).crypto) {
    (globalThis as any).crypto = {};
  }
  
  if (!(globalThis as any).crypto.randomUUID) {
    if (typeof window !== 'undefined' && (window as any).crypto && (window as any).crypto.randomUUID) {
      (globalThis as any).crypto.randomUUID = (window as any).crypto.randomUUID;
    } else {
      (globalThis as any).crypto.randomUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      } as () => string;
    }
  }
}

export {};
