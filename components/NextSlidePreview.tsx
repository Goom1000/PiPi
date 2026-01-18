import React from 'react';
import { Slide } from '../types';

interface NextSlidePreviewProps {
  nextSlide: Slide | null;
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Toggleable preview panel showing the next slide's content.
 * Helps presenters see what's coming without looking at the projector.
 */
const NextSlidePreview: React.FC<NextSlidePreviewProps> = ({
  nextSlide,
  isVisible,
  onToggle,
}) => {
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        title="Toggle next slide preview"
        className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 border border-slate-600"
      >
        {isVisible ? 'Hide Preview' : 'Preview'}
      </button>

      {/* Preview Panel */}
      {isVisible && (
        <div className="absolute bottom-20 right-4 z-50 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
          {/* Header */}
          <div className="px-2 py-1 border-b border-slate-700">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              Next Slide
            </span>
          </div>

          {/* Content */}
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
      )}
    </>
  );
};

export default NextSlidePreview;
