export interface AccessKeyExchangeRequest {
  access_key: string;
}

export interface AccessKeyExchangeResponse {
  session_token: string;
  expires_at: string;
  club_id: string;
  session_id?: string | null;
  club_name?: string | null;
}