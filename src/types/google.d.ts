/**
 * Type definitions for Google APIs used in Drive Picker
 */

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken(options?: { prompt?: string }): void;
      }

      interface TokenResponse {
        access_token: string;
        error?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;

      function revoke(token: string, callback: () => void): void;
    }
  }

  namespace picker {
    enum Action {
      PICKED = 'picked',
      CANCEL = 'cancel',
    }

    enum ViewId {
      DOCS = 'docs',
      FOLDERS = 'folders',
      DOCUMENTS = 'documents',
      SPREADSHEETS = 'spreadsheets',
      PRESENTATIONS = 'presentations',
      PDFS = 'pdfs',
      FORMS = 'forms',
    }

    interface Document {
      id: string;
      name: string;
      mimeType: string;
      url: string;
      sizeBytes?: number;
      lastEditedUtc?: number;
      iconUrl?: string;
      description?: string;
      embedUrl?: string;
      parentId?: string;
    }

    interface ResponseObject {
      action: Action | string;
      docs: Document[];
    }

    class PickerBuilder {
      addView(viewId: ViewId): PickerBuilder;
      setOAuthToken(token: string): PickerBuilder;
      setDeveloperKey(key: string): PickerBuilder;
      setCallback(callback: (data: ResponseObject) => void): PickerBuilder;
      setTitle(title: string): PickerBuilder;
      setLocale(locale: string): PickerBuilder;
      enableFeature(feature: Feature): PickerBuilder;
      build(): Picker;
    }

    interface Picker {
      setVisible(visible: boolean): void;
      dispose(): void;
    }

    enum Feature {
      MULTISELECT_ENABLED = 'multiselectEnabled',
      NAV_HIDDEN = 'navHidden',
      SUPPORT_DRIVES = 'supportDrives',
    }
  }
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;
}
