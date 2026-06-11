export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
}
