import React from 'react';

interface GridOverlayProps {
  gridSize: number;  // Grid cell size in pixels
  visible: boolean;  // Whether to show the overlay
}

/**
 * Grid overlay component that displays during drag when snap-to-grid is enabled.
 *
 * Uses SVG pattern element for efficient grid rendering without creating
 * hundreds of DOM elements. Positioned fixed to cover the entire viewport
 * with pointer-events: none so it doesn't interfere with drag operations.
 */
const GridOverlay: React.FC<GridOverlayProps> = ({ gridSize, visible }) => {
  if (!visible) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{ zIndex: 9998 }}  // Below FloatingWindow (9999)
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"  // Subtle indigo
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};

export default GridOverlay;
