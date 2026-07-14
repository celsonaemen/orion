"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { AuthenticatedUser } from "@/types/auth";

const AuthenticatedUserContext = createContext<AuthenticatedUser | null>(null);

type AuthenticatedUserProviderProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function AuthenticatedUserProvider({ children, user }: AuthenticatedUserProviderProps) {
  return (
    <AuthenticatedUserContext.Provider value={user}>{children}</AuthenticatedUserContext.Provider>
  );
}

export function useAuthenticatedUser() {
  const user = useContext(AuthenticatedUserContext);

  if (!user) {
    throw new Error("useAuthenticatedUser must be used inside AuthenticatedUserProvider.");
  }

  return user;
}
