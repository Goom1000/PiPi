
export interface Slide {
  id: string;
  title: string;
  content: string[]; // Bullet points
  speakerNotes: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  layout?: 'split' | 'full-image' | 'center-text' | 'flowchart' | 'grid' | 'tile-overlap';
  theme?: 'default' | 'purple' | 'blue' | 'green' | 'warm';
  backgroundColor?: string;
  hasQuestionFlag?: boolean;
}

// BroadcastChannel configuration for dual-window sync
export const BROADCAST_CHANNEL_NAME = 'pipi-presentation';

// State synchronized between teacher and student windows
export interface PresentationState {
  currentIndex: number;
  visibleBullets: number;
  slides: Slide[];
}

// Discriminated union for type-safe message handling
export type PresentationMessage =
  | { type: 'STATE_UPDATE'; payload: PresentationState }
  | { type: 'STATE_REQUEST' };

export interface LessonResource {
  id: string;
  title: string;
  type: 'worksheet' | 'handout' | 'guide' | 'list' | 'quiz';
  targetAudience: 'student' | 'teacher' | 'support' | 'extension';
  content: string; // Markdown formatted content
  imagePrompt?: string; // Prompt for the header visual
  imageUrl?: string;    // The generated image
  isGeneratingImage?: boolean; // Tracking state
}

export interface LessonPlan {
  topic: string;
  gradeLevel: string; // Defaults to "Year 6" (10-11yo)
  slides: Slide[];
}

export enum AppState {
  INPUT = 'INPUT',
  PROCESSING_TEXT = 'PROCESSING_TEXT',
  EDITING = 'EDITING',
  PRESENTING = 'PRESENTING',
}

// Global definition for PptxGenJS loaded via script tag
declare global {
  interface Window {
    PptxGenJS: any;
  }
}
