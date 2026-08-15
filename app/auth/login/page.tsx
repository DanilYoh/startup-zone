import { AuthShell } from "@/app/auth/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { isReadOnlyDemoEnabled } from "@/lib/env";

export default function Page() {
  return (
    <AuthShell>
      <LoginForm readOnlyDemoEnabled={isReadOnlyDemoEnabled()} />
    </AuthShell>
  );
}
