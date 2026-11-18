export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
] as const;

export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function validateImageFile(
  file: File,
  allowedTypes: readonly string[] = IMAGE_MIME_TYPES,
  maxBytes = MAX_IMAGE_SIZE_BYTES
): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  const lowerName = file.name.toLowerCase();
  const hasValidExt = /\.(jpe?g|png|webp|gif|bmp)$/i.test(lowerName);
  const hasValidMime = allowedTypes.includes(file.type.toLowerCase());

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: `Unsupported file "${file.name}". Please choose a JPG, PNG, or WebP image.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: `File "${file.name}" appears to be empty.` };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB browser limit.`,
    };
  }
  return { valid: true };
}

export async function validatePdfFile(
  file: File,
  maxBytes = MAX_PDF_SIZE_BYTES
): Promise<ValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';

  if (!isPdfExt && !isPdfMime) {
    return {
      valid: false,
      error: `"${file.name}" is not a PDF document.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" is an empty file.` };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB browser limit.`,
    };
  }

  // Check PDF magic header (%PDF-)
  try {
    const headerSlice = await file.slice(0, 8).text();
    if (!headerSlice.includes('%PDF-')) {
      return {
        valid: false,
        error: `"${file.name}" does not have a valid PDF file signature.`,
      };
    }
  } catch {
    return {
      valid: false,
      error: `Could not read "${file.name}". Please verify file permissions.`,
    };
  }

  return { valid: true };
}
