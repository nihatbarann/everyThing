import React, { useMemo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// Renders a draw.io-style infinite canvas (shapes, arrows, freehand text)
// powered by Excalidraw. The full scene (elements + relevant appState + files)
// is serialized to a single JSON string written into sceneRef.current on every
// change — NOT into React state, since Excalidraw fires onChange on every
// pointer move and routing that through a re-render loops infinitely.
const DiagramEditor = ({ content, sceneRef }) => {
  const initialData = useMemo(() => {
    if (!content) return { elements: [], appState: {}, files: {} };
    try {
      const parsed = JSON.parse(content);
      return {
        elements: parsed.elements || [],
        appState: parsed.appState || {},
        files: parsed.files || {},
      };
    } catch {
      return { elements: [], appState: {}, files: {} };
    }
  }, []); // scene is only ever loaded once; live edits flow through onChange

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark-theme');

  const handleChange = (elements, appState, files) => {
    sceneRef.current = JSON.stringify({
      elements,
      appState: { viewBackgroundColor: appState.viewBackgroundColor },
      files,
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Excalidraw
        initialData={initialData}
        onChange={handleChange}
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
};

export default DiagramEditor;
