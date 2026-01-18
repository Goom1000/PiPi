import React from 'react';
import { createPortal } from 'react-dom';
import { Slide } from '../types';
import FloatingWindow from './FloatingWindow';
import { usePreviewPersistence } from '../hooks/usePreviewPersistence';

interface NextSlidePreviewProps {
  nextSlide: Slide | null;
  isVisible: boolean;
  onToggle: () => void;
  slides: Slide[]; // Needed to derive presentationId from slides[0].id
}

/**
 * Toggleable preview panel showing the next slide's content.
 * Renders as a freely draggable and resizable floating window.
 * Helps presenters see what's coming without looking at the projector.
 */
const NextSlidePreview: React.FC<NextSlidePreviewProps> = ({
  nextSlide,
  isVisible,
  onToggle,
  slides,
}) => {
  // Derive presentation ID from first slide for per-presentation persistence
  const presentationId = slides.length > 0 ? slides[0].id : 'default';

  // Default values for new presentations
  const defaultState = {
    x: Math.max(0, window.innerWidth - 220),
    y: Math.max(0, window.innerHeight - 200),
    width: 200,
    height: 150,
    snapEnabled: false,
  };

  // Persistence hook - saves position, size, and snap state to localStorage
  const [previewState, updatePreviewState] = usePreviewPersistence(
    presentationId,
    defaultState
  );

  return (
    <>
      {/* Toggle Button - stays in header toolbar */}
      <button
        onClick={onToggle}
        title="Toggle next slide preview"
        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 border border-slate-600"
      >
        {isVisible ? 'Hide Preview' : 'Preview'}
      </button>

      {/* Floating Preview Panel - rendered via Portal for z-index isolation */}
      {isVisible &&
        createPortal(
          <FloatingWindow
            defaultPosition={{ x: previewState.x, y: previewState.y }}
            defaultSize={{ width: previewState.width, height: previewState.height }}
            position={{ x: previewState.x, y: previewState.y }}
            size={{ width: previewState.width, height: previewState.height }}
            onPositionChange={(pos) => updatePreviewState({ x: pos.x, y: pos.y })}
            onSizeChange={(size) => updatePreviewState({ width: size.width, height: size.height })}
            snapEnabled={previewState.snapEnabled}
            onSnapToggle={() => updatePreviewState({ snapEnabled: !previewState.snapEnabled })}
            minWidth={200}
            minHeight={150}
            aspectRatio={16 / 9}
            zIndex={9999}
          >
            {/* Content - clean window, no header label per CONTEXT.md */}
            <div className="w-full h-full bg-slate-800">
              <div className="aspect-video">
                {nextSlide ? (
                  <div className="h-full w-full bg-white p-2 overflow-hidden">
                    {/* Title */}
                    <div className="text-[10px] font-bold text-slate-800 truncate mb-1">
                      {nextSlide.title}
                    </div>
                    {/* First 3 bullets */}
                    <div className="space-y-0.5">
                      {nextSlide.content.slice(0, 3).map((bullet, idx) => (
                        <div
                          key={idx}
                          className="text-[8px] text-slate-600 truncate leading-tight"
                        >
                          {bullet}
                        </div>
                      ))}
                      {nextSlide.content.length > 3 && (
                        <div className="text-[8px] text-slate-400 italic">
                          +{nextSlide.content.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full bg-slate-900 flex items-center justify-center">
                    <span className="text-[10px] text-slate-500">
                      End of presentation
                    </span>
                  </div>
                )}
              </div>
            </div>
          </FloatingWindow>,
          document.body
        )}
    </>
  );
};

export default NextSlidePreview;
