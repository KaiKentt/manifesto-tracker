import { redirect } from "next/navigation";

// Keep the existing pitch bookmark working after promoting it to the site homepage.
export default function PitchPage() {
  redirect("/");
}
