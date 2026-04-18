'use client';

import { useState, useEffect } from 'react';

export function MobileLayoutDebug() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Only show debug on small screens or when manually toggled
  if (!showDebug && viewport.width >= 1024) return null;

  const mainContent = document.getElementById('main-content');
  const mainRect = mainContent?.getBoundingClientRect();
  const mainStyles = mainContent ? getComputedStyle(mainContent) : null;

  return (
    <div className="fixed top-2 right-2 z-50 bg-red-900/90 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">📱 Layout Debug</span>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="text-red-200 hover:text-white"
        >
          {showDebug ? '✕' : '?'}
        </button>
      </div>
      
      <div className="space-y-1">
        <div>Viewport: {viewport.width}×{viewport.height}</div>
        <div>Breakpoint: {
          viewport.width >= 1024 ? 'lg+' : 
          viewport.width >= 768 ? 'md' : 'sm'
        }</div>
        
        {mainRect && (
          <>
            <div>Content Left: {Math.round(mainRect.left)}px</div>
            <div>Content Width: {Math.round(mainRect.width)}px</div>
            {mainStyles && (
              <div>Margin Left: {mainStyles.marginLeft}</div>
            )}
          </>
        )}
        
        <div className="mt-2 pt-2 border-t border-red-700">
          <div className="text-yellow-200">
            {viewport.width < 1024 ? '✅ Mobile: No sidebar margin' : '⚠️ Desktop: Should have margin'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add global toggle for debugging
if (typeof window !== 'undefined') {
  (window as any).toggleLayoutDebug = () => {
    const event = new CustomEvent('toggleLayoutDebug');
    window.dispatchEvent(event);
  };
}
