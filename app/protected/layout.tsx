import { DashboardShell } from "@/components/dashboard-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
