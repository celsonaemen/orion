export type AccessTokenPayload = {
  sub: string;
  email: string;
  sessionId: string;
  tokenUse: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  tokenId: string;
  tokenUse: "refresh";
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};
