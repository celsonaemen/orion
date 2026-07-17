import { redirect } from "next/navigation";

import { homeRoute } from "@/features/app-shell/routes";

export default function HomePage() {
  redirect(homeRoute);
}
