import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 * Example: { 'ctrl+k': () => console.log('Search'), 'escape': () => closeModal() }
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const combo = [
        event.ctrlKey && 'ctrl',
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        event.metaKey && 'meta',
        key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta' && key,
      ]
        .filter(Boolean)
        .join('+');

      if (shortcuts[combo]) {
        event.preventDefault();
        shortcuts[combo](event);
      } else if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Keyboard shortcuts help modal data
 */
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Focus search' },
      { keys: ['Escape'], description: 'Close modals/Clear focus' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    category: 'Actions',
    shortcuts: [
      { keys: ['Ctrl', 'E'], description: 'Export data' },
      { keys: ['Ctrl', 'P'], description: 'Print report' },
      { keys: ['Ctrl', 'D'], description: 'Toggle dark mode' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: ['A'], description: 'Expand all files' },
      { keys: ['C'], description: 'Collapse all files' },
    ],
  },
];
