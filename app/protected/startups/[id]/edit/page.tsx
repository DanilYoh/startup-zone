import { permanentRedirect } from "next/navigation";

export default async function LegacyEditStartupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/dashboard/startups/${encodeURIComponent(id)}/edit`);
}
