export type HttpRequest = {
  ip?: string;
  headers: {
    authorization?: string | string[] | undefined;
    "user-agent"?: string | string[] | undefined;
    [key: string]: string | string[] | undefined;
  };
};
