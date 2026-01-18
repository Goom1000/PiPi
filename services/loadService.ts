import { PiPiFile, CURRENT_FILE_VERSION } from '../types';

/**
 * Type guard to validate that parsed data has the expected PiPiFile shape.
 * Follows existing isValidSettings pattern from useSettings.ts.
 *
 * @param data - Unknown data to validate
 * @returns True if data is a valid PiPiFile
 */
export function isValidPiPiFile(data: unknown): data is PiPiFile {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  // Validate version is a number
  if (typeof obj.version !== 'number') return false;

  // Validate title is a string
  if (typeof obj.title !== 'string') return false;

  // Validate content is an object
  if (typeof obj.content !== 'object' || obj.content === null) return false;

  const content = obj.content as Record<string, unknown>;

  // Validate content.slides is an array
  if (!Array.isArray(content.slides)) return false;

  return true;
}

/**
 * Migrate file data from older versions to current version.
 * Currently a no-op since version 1 is current; kept as future-proofing.
 *
 * @param data - PiPiFile with potentially older version
 * @returns Migrated PiPiFile at CURRENT_FILE_VERSION
 */
function migrateFile(data: PiPiFile): PiPiFile {
  const fromVersion = data.version;

  if (fromVersion < CURRENT_FILE_VERSION) {
    console.log(`Migrating file from version ${fromVersion} to ${CURRENT_FILE_VERSION}`);
    // Version 1 is current - no migration needed yet
    // Future: Add migration logic here as schema evolves
    // e.g., if (fromVersion === 1) { return migrateV1toV2(data); }
  }

  return {
    ...data,
    version: CURRENT_FILE_VERSION,
  };
}

/**
 * Read and parse a .pipi file from a File object.
 *
 * Validates file extension, parses JSON, validates structure,
 * and migrates from older versions if needed.
 *
 * @param file - File object from file input or drag-drop
 * @returns Promise resolving to validated PiPiFile
 * @throws Error with user-friendly message on validation failure
 */
export function readPiPiFile(file: File): Promise<PiPiFile> {
  return new Promise((resolve, reject) => {
    // Validate file extension
    if (!file.name.endsWith('.pipi')) {
      reject(new Error('Invalid file type. Expected .pipi file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        // Parse JSON
        const data = JSON.parse(reader.result as string);

        // Validate structure
        if (!isValidPiPiFile(data)) {
          reject(new Error('File format is corrupted or incompatible.'));
          return;
        }

        // Migrate from older versions if needed
        const migratedData = data.version < CURRENT_FILE_VERSION
          ? migrateFile(data)
          : data;

        resolve(migratedData);
      } catch (e) {
        // JSON parse error
        reject(new Error('File contains invalid JSON.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };

    reader.readAsText(file);
  });
}
