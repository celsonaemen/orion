import type { UserStatus } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  sessionId: string;
  role: {
    id: string;
    name: string;
    slug: string;
    hierarchyLevel: number;
  };
  sector: {
    id: string;
    name: string;
    slug: string;
  } | null;
  permissions: string[];
};
