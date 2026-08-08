import { permanentRedirect } from "next/navigation";

export default function LegacyProtectedPage() {
  permanentRedirect("/dashboard");
}
