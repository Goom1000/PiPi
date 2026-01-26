import React from 'react';
import { PosterLayout, PosterSection } from '../types';

interface PosterRendererProps {
  layout: PosterLayout;
}

/**
 * Renders a PosterLayout as an A4 portrait-sized div for PDF capture.
 * Uses inline styles for color scheme (dynamic per-poster) and Tailwind for structure.
 *
 * Dimensions: 595x842px (A4 at 72 DPI, will be captured at 2x for print quality)
 */
const PosterRenderer: React.FC<PosterRendererProps> = ({ layout }) => {
  const titleSizeClasses = {
    'large': 'text-4xl',   // ~36-48pt at this scale
    'xl': 'text-5xl',      // ~48-60pt
    '2xl': 'text-6xl'      // ~60-72pt
  };

  const renderSection = (section: PosterSection, index: number) => {
    const baseClasses = section.emphasis
      ? 'p-3 rounded-lg border-2'
      : '';

    const emphasisStyle = section.emphasis
      ? {
          borderColor: layout.colorScheme.primary,
          backgroundColor: `${layout.colorScheme.primary}15` // 15% opacity
        }
      : {};

    return (
      <div
        key={index}
        className={baseClasses}
        style={emphasisStyle}
      >
        {/* Section heading */}
        {section.heading && (
          <h2
            className="text-xl font-semibold mb-1"
            style={{ color: layout.colorScheme.primary }}
          >
            {section.heading}
          </h2>
        )}

        {/* Section content by format */}
        {section.format === 'bullet' ? (
          <div className="flex items-start gap-2">
            <span
              className="text-lg mt-0.5 flex-shrink-0"
              style={{ color: layout.colorScheme.primary }}
            >
              {'\u2022'}
            </span>
            <p className="text-base leading-relaxed">{section.content}</p>
          </div>
        ) : section.format === 'callout' ? (
          <div
            className="p-3 rounded-lg border-l-4"
            style={{
              borderLeftColor: layout.colorScheme.primary,
              backgroundColor: `${layout.colorScheme.secondary}10`
            }}
          >
            <p className="text-base font-medium leading-relaxed">{section.content}</p>
          </div>
        ) : (
          <p className="text-base leading-relaxed">{section.content}</p>
        )}
      </div>
    );
  };

  return (
    <div
      className="w-[595px] h-[842px] p-8 flex flex-col font-sans"
      style={{
        backgroundColor: layout.colorScheme.background,
        color: layout.colorScheme.text
      }}
    >
      {/* Title */}
      <h1
        className={`${titleSizeClasses[layout.typography.titleSize]} font-bold mb-2 leading-tight`}
        style={{ color: layout.colorScheme.primary }}
      >
        {layout.title}
      </h1>

      {/* Subtitle */}
      {layout.subtitle && (
        <p
          className="text-lg mb-6 italic"
          style={{ color: layout.colorScheme.secondary }}
        >
          {layout.subtitle}
        </p>
      )}

      {/* Decorative divider */}
      <div
        className="h-1 w-24 mb-6 rounded"
        style={{ backgroundColor: layout.colorScheme.primary }}
      />

      {/* Sections */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {layout.sections.map((section, i) => renderSection(section, i))}
      </div>

      {/* Footer decoration */}
      <div
        className="h-1 w-full mt-6 rounded"
        style={{ backgroundColor: layout.colorScheme.primary }}
      />
    </div>
  );
};

export default PosterRenderer;
