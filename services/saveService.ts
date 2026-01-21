import { Slide, PiPiFile, CURRENT_FILE_VERSION, StudentWithGrade } from '../types';

/**
 * Create a PiPiFile object for saving.
 *
 * @param title - Presentation title
 * @param slides - Array of slides
 * @param studentNames - Array of student names
 * @param lessonText - Original lesson text input
 * @param existingFile - Optional existing file to preserve createdAt
 * @param studentGrades - Optional array of student grade assignments
 * @returns PiPiFile object ready for serialization
 */
export function createPiPiFile(
  title: string,
  slides: Slide[],
  studentNames: string[],
  lessonText: string,
  existingFile?: PiPiFile,
  studentGrades?: StudentWithGrade[]
): PiPiFile {
  const now = new Date().toISOString();

  return {
    version: CURRENT_FILE_VERSION,
    createdAt: existingFile?.createdAt ?? now,
    modifiedAt: now,
    title,
    content: {
      slides,
      studentNames,
      lessonText,
      ...(studentGrades && studentGrades.length > 0 ? { studentGrades } : {}),
    },
  };
}

/**
 * Check the size of a PiPiFile when serialized to JSON.
 *
 * @param file - The PiPiFile to check
 * @returns Object with size in bytes, MB, and whether it exceeds 50MB
 */
export function checkFileSize(file: PiPiFile): {
  sizeBytes: number;
  sizeMB: number;
  exceeds50MB: boolean;
} {
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const sizeBytes = blob.size;
  const sizeMB = sizeBytes / (1024 * 1024);

  return {
    sizeBytes,
    sizeMB,
    exceeds50MB: sizeMB > 50,
  };
}

/**
 * Trigger a browser download of the presentation as a .pipi file.
 *
 * Creates a Blob from the serialized JSON, generates an object URL,
 * and triggers a download via a hidden anchor element.
 *
 * @param file - The PiPiFile to download
 * @param filename - Desired filename (will ensure .pipi extension)
 */
export function downloadPresentation(file: PiPiFile, filename: string): void {
  // Serialize with pretty-print for human readability
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Ensure filename ends with .pipi
  const finalFilename = filename.endsWith('.pipi') ? filename : `${filename}.pipi`;

  // Create hidden anchor and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Firefox needs delay before revoke - see MDN URL.createObjectURL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
