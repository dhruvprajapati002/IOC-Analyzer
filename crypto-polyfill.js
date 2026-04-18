// Polyfill for crypto.randomUUID in older Node.js versions
if (typeof globalThis !== 'undefined' && typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto').webcrypto || require('crypto');
}

if (typeof globalThis !== 'undefined' && globalThis.crypto && !globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = function() {
    return require('crypto').randomUUID();
  };
}

// For browser environment
if (typeof window !== 'undefined' && window.crypto && !window.crypto.randomUUID) {
  window.crypto.randomUUID = function() {
    // Fallback implementation for browsers that don't support crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}
