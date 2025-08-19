export interface GoogleAccounts {
  oauth2: {
    initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
  };
}

export interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
}

export interface GoogleTokenClient {
  requestAccessToken: () => void;
}

export interface GoogleTokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
}

export interface WindowWithGoogle extends Window {
  google?: {
    accounts: GoogleAccounts;
  };
}
