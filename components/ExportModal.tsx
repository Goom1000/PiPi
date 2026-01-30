import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Slide, PosterLayout } from '../types';
import { SlideContentRenderer } from './SlideRenderers';
import PosterRenderer from './PosterRenderer';
import { generatePosterLayouts, PosterGenerationProgress } from '../services/posterService';

// ============================================================================
// Types
// ============================================================================

interface ExportModalProps {
  /** All slides in the presentation */
  slides: Slide[];
  /** Currently selected slide IDs */
  selectedSlideIds: Set<string>;
  /** Callback to update selection (syncs with main state) */
  onUpdateSelection: (ids: Set<string>) => void;
  /** Callback when modal closes */
  onClose: () => void;
  /** Toast notification function */
  addToast: (message: string, duration?: number, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

type ExportMode = 'quick' | 'ai-poster';

// ============================================================================
// ExportModal Component
// ============================================================================

/**
 * Modal for exporting selected slides as A4 PDFs for Working Wall display.
 *
 * Features:
 * - Mode selection: Quick Export (exact slides) vs AI Poster (coming soon)
 * - Preview grid of selected slides with removal capability
 * - Selection sync: removing slides updates main selection state
 * - Quick Export generates A4 landscape PDF with one slide per page
 * - PDF auto-downloads after generation
 *
 * Follows existing modal patterns (ClassBankSaveModal, RecoveryModal):
 * - Fixed overlay with dark backdrop
 * - Centered modal card with rounded corners
 * - Dark mode support
 * - Escape key closes modal (except during generation)
 */
const ExportModal: React.FC<ExportModalProps> = ({
  slides,
  selectedSlideIds,
  onUpdateSelection,
  onClose,
  addToast,
}) => {
  const [exportMode, setExportMode] = useState<ExportMode>('quick');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // AI Poster state
  const [posterLayouts, setPosterLayouts] = useState<PosterLayout[]>([]);
  const [isGeneratingPosters, setIsGeneratingPosters] = useState(false);
  const [posterProgress, setPosterProgress] = useState<PosterGenerationProgress | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const renderContainerRef = useRef<HTMLDivElement>(null);

  // Get API key from localStorage (same pattern as other AI features)
  const getApiKey = (): string => {
    try {
      const settings = JSON.parse(localStorage.getItem('ai_settings') || '{}');
      return settings.apiKey || '';
    } catch {
      return '';
    }
  };

  // Get selected slides in presentation order
  const selectedSlides = slides.filter(s => selectedSlideIds.has(s.id));

  // Handle escape key to close (disabled during generation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isGenerating]);

  // Remove slide from selection
  const handleRemoveSlide = useCallback((slideId: string) => {
    const newIds = new Set(selectedSlideIds);
    newIds.delete(slideId);
    onUpdateSelection(newIds);
  }, [selectedSlideIds, onUpdateSelection]);

  // Generate AI posters for selected slides
  const generatePosters = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('No API key configured');
      addToast('API key required for AI Poster generation. Please configure your Anthropic API key in Settings.', 5000, 'error');
      return;
    }

    setIsGeneratingPosters(true);
    setPosterLayouts([]);

    try {
      // Get indices of selected slides
      const selectedIndices = selectedSlides.map(s => slides.findIndex(slide => slide.id === s.id));

      const layouts = await generatePosterLayouts(
        slides,
        selectedIndices,
        apiKey,
        (progress) => setPosterProgress(progress)
      );

      setPosterLayouts(layouts);
    } catch (error) {
      console.error('Poster generation error:', error);
      addToast('Failed to generate AI posters. Please try again.', 5000, 'error');
    } finally {
      setIsGeneratingPosters(false);
      setPosterProgress(null);
    }
  };

  // Regenerate a single poster
  const regeneratePoster = async (layoutIndex: number) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      addToast('API key required for poster regeneration. Please configure your Anthropic API key in Settings.', 5000, 'error');
      return;
    }

    setRegeneratingIndex(layoutIndex);

    try {
      const slideIndex = slides.findIndex(s => s.id === selectedSlides[layoutIndex].id);

      const [newLayout] = await generatePosterLayouts(
        slides,
        [slideIndex],
        apiKey
      );

      // Update the specific layout
      setPosterLayouts(prev => {
        const updated = [...prev];
        updated[layoutIndex] = newLayout;
        return updated;
      });
    } catch (error) {
      console.error('Poster regeneration error:', error);
      addToast('Failed to regenerate poster. Please try again.', 5000, 'error');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Generate PDF from poster layouts (A4 portrait)
  const generatePosterPDF = async () => {
    if (posterLayouts.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: posterLayouts.length });

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < posterLayouts.length; i++) {
        if (i > 0) pdf.addPage();
        setGenerationProgress({ current: i + 1, total: posterLayouts.length });

        const container = renderContainerRef.current;
        if (!container) continue;

        // Create temporary element for this poster
        const posterElement = document.createElement('div');
        posterElement.style.width = '595px';
        posterElement.style.height = '842px';
        posterElement.style.position = 'relative';
        container.innerHTML = '';
        container.appendChild(posterElement);

        // Render PosterRenderer into element
        const root = ReactDOM.createRoot(posterElement);
        root.render(<PosterRenderer layout={posterLayouts[i]} />);

        // Wait for render + fonts
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 200));

        // Capture to canvas
        const canvas = await html2canvas(posterElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: posterLayouts[i].colorScheme.background,
          logging: false
        });

        // Add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

        // Cleanup
        root.unmount();
      }

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `AI Poster Export - ${date}.pdf`;

      pdf.save(filename);
      onClose();
    } catch (error) {
      console.error('PDF generation error:', error);
      addToast('Failed to generate PDF. Please try again.', 5000, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Generate PDF for Quick Export
  const generatePDF = async () => {
    if (selectedSlides.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedSlides.length });

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < selectedSlides.length; i++) {
        if (i > 0) pdf.addPage();
        setGenerationProgress({ current: i + 1, total: selectedSlides.length });

        const slide = selectedSlides[i];
        const container = renderContainerRef.current;
        if (!container) continue;

        // Create temporary element for this slide
        const slideElement = document.createElement('div');
        slideElement.style.width = '1190px';
        slideElement.style.height = '842px';
        slideElement.style.position = 'relative';
        container.innerHTML = '';
        container.appendChild(slideElement);

        // Render SlideContentRenderer into element using ReactDOM
        const root = ReactDOM.createRoot(slideElement);
        root.render(
          <SlideContentRenderer
            slide={slide}
            visibleBullets={slide.content.length}
          />
        );

        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 150));

        // Capture to canvas
        const canvas = await html2canvas(slideElement, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          logging: false
        });

        // Add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

        // Cleanup
        root.unmount();
      }

      // Generate filename: "Working Wall Export - {date}.pdf"
      const date = new Date().toISOString().split('T')[0];
      const filename = `Working Wall Export - ${date}.pdf`;

      // Trigger download
      pdf.save(filename);
      onClose();
    } catch (error) {
      console.error('PDF generation error:', error);
      addToast('Failed to generate PDF. Please try again.', 5000, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Handle export button click
  const handleExport = () => {
    if (exportMode === 'quick') {
      generatePDF();
    } else if (exportMode === 'ai-poster') {
      if (posterLayouts.length > 0) {
        // Already have layouts, generate PDF
        generatePosterPDF();
      } else {
        // Need to generate layouts first
        generatePosters();
      }
    }
  };

  // Get button text
  const getExportButtonText = () => {
    if (isGenerating && generationProgress) {
      return `Generating PDF... ${generationProgress.current}/${generationProgress.total}`;
    }
    if (exportMode === 'ai-poster') {
      if (isGeneratingPosters) {
        return `Generating Posters... ${posterProgress?.current || 0}/${posterProgress?.total || 0}`;
      }
      if (posterLayouts.length > 0) {
        return posterLayouts.length === 1 ? 'Export 1 Poster' : `Export ${posterLayouts.length} Posters`;
      }
      return 'Generate Posters';
    }
    const count = selectedSlides.length;
    return count === 1 ? 'Export 1 Slide' : `Export ${count} Slides`;
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">

          {/* Loading overlay during generation */}
          {isGenerating && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex items-center justify-center rounded-3xl">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 dark:border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg font-bold text-slate-700 dark:text-white">
                  Generating PDF... {generationProgress?.current}/{generationProgress?.total}
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="p-6 pb-0 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white font-fredoka">
                  Export for Working Wall
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Create printable A4 posters from your slides
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Selection */}
          <div className="px-6 pt-6">
            <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-3 block">
              Export Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Quick Export */}
              <button
                onClick={() => setExportMode('quick')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  exportMode === 'quick'
                    ? 'border-indigo-600 dark:border-amber-500 bg-indigo-50 dark:bg-amber-500/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-bold text-slate-800 dark:text-white">Quick Export</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Export slides exactly as they appear
                </p>
              </button>

              {/* AI Poster */}
              <button
                onClick={() => {
                  setExportMode('ai-poster');
                  setPosterLayouts([]); // Reset layouts when switching mode
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  exportMode === 'ai-poster'
                    ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-500/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="font-bold text-slate-800 dark:text-white">AI Poster</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Transform into educational posters
                </p>
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {exportMode === 'quick' ? (
              <>
                {/* Quick Export preview */}
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-3 block">
                  Selected Slides ({selectedSlides.length})
                </label>

                {selectedSlides.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500">
                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-medium">No slides selected</p>
                    <p className="text-sm mt-1">Select slides in the editor to export</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSlides.map((slide, idx) => {
                      // Find original index in slides array for numbering
                      const originalIndex = slides.findIndex(s => s.id === slide.id);

                      return (
                        <div
                          key={slide.id}
                          className="relative group aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                          {/* Slide thumbnail preview */}
                          <div className="w-full h-full overflow-hidden" style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}>
                            <SlideContentRenderer
                              slide={slide}
                              visibleBullets={slide.content.length}
                            />
                          </div>

                          {/* Slide number badge */}
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            {originalIndex + 1}
                          </div>

                          {/* Remove button (visible on hover) */}
                          <button
                            onClick={() => handleRemoveSlide(slide.id)}
                            disabled={isGenerating}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove from export"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* AI Poster preview */}
                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-3 block">
                  {posterLayouts.length > 0
                    ? `AI Posters (${posterLayouts.length})`
                    : `Selected Slides (${selectedSlides.length})`
                  }
                </label>

                {isGeneratingPosters ? (
                  <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-2xl">
                    <div className="w-10 h-10 border-4 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-slate-700 dark:text-white">
                      Generating poster {posterProgress?.current || 1} of {posterProgress?.total || selectedSlides.length}...
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      AI is transforming your slides
                    </p>
                  </div>
                ) : posterLayouts.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500">
                    <svg className="w-12 h-12 mb-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="font-medium">Ready to generate AI posters</p>
                    <p className="text-sm mt-1">Click "Generate Posters" to transform {selectedSlides.length} slide{selectedSlides.length !== 1 ? 's' : ''}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {posterLayouts.map((layout, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        style={{ aspectRatio: '595/842' }}
                      >
                        {/* Poster thumbnail */}
                        <div className="w-full h-full overflow-hidden" style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: '500%', height: '500%' }}>
                          <PosterRenderer layout={layout} />
                        </div>

                        {/* Poster title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-bold truncate">{layout.title}</p>
                        </div>

                        {/* Regenerate button */}
                        <button
                          onClick={() => regeneratePoster(idx)}
                          disabled={regeneratingIndex !== null || isGenerating}
                          className="absolute top-2 right-2 w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Regenerate this poster"
                        >
                          {regeneratingIndex === idx ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-0 flex flex-col gap-3">
            <button
              onClick={handleExport}
              disabled={selectedSlides.length === 0 || isGenerating || isGeneratingPosters}
              className="w-full px-5 py-3 bg-indigo-600 dark:bg-amber-500 hover:bg-indigo-700 dark:hover:bg-amber-400 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white dark:text-slate-900 dark:disabled:text-slate-500 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {getExportButtonText()}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {getExportButtonText()}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Hidden render container for PDF capture */}
      <div
        ref={renderContainerRef}
        className="fixed -left-[9999px] top-0 pointer-events-none"
        style={{ width: exportMode === 'ai-poster' ? '595px' : '1190px', height: '842px' }}
        aria-hidden="true"
      />
    </>
  );
};

export default ExportModal;
