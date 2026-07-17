import { redirect } from "next/navigation";

export default function PrivateMessagesPage() {
  redirect("/chat");
}
