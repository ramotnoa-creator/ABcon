/**
 * Google Drive Picker Service
 *
 * Enables users to pick files from their Google Drive.
 * Requires VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID in .env
 *
 * Setup instructions:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a new project (or select existing)
 * 3. Enable "Google Picker API" and "Google Drive API"
 * 4. Create OAuth 2.0 Client ID (Web application type)
 *    - Add authorized JavaScript origins (e.g., http://localhost:5173)
 * 5. Create API Key
 * 6. Add to .env:
 *    VITE_GOOGLE_API_KEY=your_api_key
 *    VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
 */

// Types for Google Picker API
interface GooglePickerDocument {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
  iconUrl?: string;
}

interface GooglePickerResult {
  success: boolean;
  file?: {
    id: string;
    name: string;
    mimeType: string;
    url: string;
    size?: string;
    webViewLink?: string;
  };
  error?: string;
}

// Environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// Track if APIs are loaded
let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

// Declare google namespace for TypeScript
declare global {
  interface Window {
    gapi: typeof gapi;
    google: typeof google;
  }
}

/**
 * Check if Google Drive integration is configured
 */
export function isGoogleDriveConfigured(): boolean {
  return Boolean(API_KEY && CLIENT_ID);
}

/**
 * Load the Google API script
 */
function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('picker', () => {
        gapiLoaded = true;
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
}

/**
 * Load the Google Identity Services script
 */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize the token client for OAuth
 */
function initTokenClient(): Promise<void> {
  return new Promise((resolve) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: () => {
        // Will be overwritten when requesting token
      },
    });
    resolve();
  });
}

/**
 * Request an access token from the user
 */
function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    // Override callback
    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(response.access_token);
    };

    // Check if we already have a token
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    // Request new token
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Create and show the Google Picker
 */
function showPicker(token: string): Promise<GooglePickerDocument | null> {
  return new Promise((resolve) => {
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .addView(window.google.picker.ViewId.FOLDERS)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setCallback((data: google.picker.ResponseObject) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          resolve({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            url: doc.url,
            sizeBytes: doc.sizeBytes,
            lastEditedUtc: doc.lastEditedUtc,
            iconUrl: doc.iconUrl,
          });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .setTitle('בחירת קובץ מ-Google Drive')
      .setLocale('he')
      .build();

    picker.setVisible(true);
  });
}

/**
 * Main function to open Google Drive Picker
 * Returns the selected file info or null if cancelled
 */
export async function openGoogleDrivePicker(): Promise<GooglePickerResult> {
  // Check configuration
  if (!isGoogleDriveConfigured()) {
    return {
      success: false,
      error: 'Google Drive לא מוגדר. נא להוסיף VITE_GOOGLE_API_KEY ו-VITE_GOOGLE_CLIENT_ID לקובץ .env',
    };
  }

  try {
    // Load scripts
    await Promise.all([loadGapiScript(), loadGisScript()]);

    // Initialize token client
    await initTokenClient();

    // Get access token
    const token = await requestAccessToken();

    // Show picker
    const selectedFile = await showPicker(token);

    if (!selectedFile) {
      return { success: false, error: 'בחירה בוטלה' };
    }

    // Create shareable link format
    const webViewLink = `https://drive.google.com/file/d/${selectedFile.id}/view`;

    return {
      success: true,
      file: {
        id: selectedFile.id,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType,
        url: selectedFile.url,
        size: formatFileSize(selectedFile.sizeBytes),
        webViewLink,
      },
    };
  } catch (error) {
    console.error('Google Drive Picker error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בפתיחת Google Drive',
    };
  }
}

/**
 * Revoke access token (for logout scenarios)
 */
export function revokeGoogleAccess(): void {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
    });
  }
}
