import { permanentRedirect } from "next/navigation";

export default function LegacyNewStartupPage() {
  permanentRedirect("/dashboard/startups/new");
}
