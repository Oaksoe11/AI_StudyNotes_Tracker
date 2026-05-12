import { redirect } from "next/navigation";

export default function HomePage() {
  // Student note:
  // When someone opens the app root, start at login first.
  // After they sign in, the login flow can send them to the dashboard.
  redirect("/login");
}
