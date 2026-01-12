import { supabase, isDemoMode } from './supabase';

const TENDER_QUOTES_BUCKET = 'tender-quotes';

/**
 * Upload a tender quote file to Supabase Storage
 * In demo mode, returns a data URL instead
 */
export async function uploadTenderQuote(
  tenderId: string,
  participantId: string,
  file: File
): Promise<string | null> {
  // In demo mode, convert file to data URL
  if (isDemoMode || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  try {
    // Create unique file path: tender-id/participant-id/timestamp_filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${tenderId}/${participantId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(TENDER_QUOTES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(TENDER_QUOTES_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Delete a tender quote file from Supabase Storage
 * In demo mode, does nothing (data URLs don't need deletion)
 */
export async function deleteTenderQuote(fileUrl: string): Promise<boolean> {
  // Data URLs don't need deletion
  if (fileUrl.startsWith('data:') || isDemoMode || !supabase) {
    return true;
  }

  try {
    // Extract file path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/tender-quotes/path/to/file
    const urlParts = fileUrl.split(`/storage/v1/object/public/${TENDER_QUOTES_BUCKET}/`);
    if (urlParts.length !== 2) {
      console.error('Invalid file URL format');
      return false;
    }

    const filePath = decodeURIComponent(urlParts[1]);

    const { error } = await supabase.storage
      .from(TENDER_QUOTES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Check if a file URL is a Supabase Storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/public/');
}

/**
 * Check if a file URL is a data URL (demo mode)
 */
export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Get file name from URL or data URL
 */
export function getFileNameFromUrl(url: string): string {
  if (isDataUrl(url)) {
    // Extract mime type and create a generic name
    const mimeMatch = url.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const extension = mimeType.split('/')[1] || 'file';
    return `quote.${extension}`;
  }

  // Extract filename from URL path
  try {
    const urlPath = new URL(url).pathname;
    const parts = urlPath.split('/');
    const fileName = parts[parts.length - 1];
    // Remove timestamp prefix if present (format: timestamp_filename)
    const nameMatch = fileName.match(/^\d+_(.+)$/);
    return nameMatch ? nameMatch[1] : fileName;
  } catch {
    return 'quote-file';
  }
}
