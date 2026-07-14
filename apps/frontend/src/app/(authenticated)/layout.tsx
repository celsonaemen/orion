import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
