export type AuthenticatedRole = {
  id: string;
  name: string;
  slug: string;
  hierarchyLevel: number;
};

export type AuthenticatedSector = {
  id: string;
  name: string;
  slug: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  sessionId: string;
  role: AuthenticatedRole;
  sector: AuthenticatedSector | null;
  permissions: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};

export type BackendAuthResponse = {
  tokens: AuthTokens;
  user: AuthenticatedUser;
};

export type SessionResponse = {
  user: AuthenticatedUser;
};
