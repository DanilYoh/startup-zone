"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, Popover, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

const logoutErrorMessage = "Could not log out. Check your connection and try again.";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    if (pending) return;

    setPending(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(logoutErrorMessage);
        return;
      }

      router.replace("/auth/login");
      router.refresh();
    } catch {
      setError(logoutErrorMessage);
    } finally {
      setPending(false);
    }
  };

  return (
    <Popover opened={Boolean(error)} position="bottom-end" withArrow shadow="md" width={260}>
      <Popover.Target>
        <Button size="compact-sm" variant="default" loading={pending} onClick={logout}>
          Logout
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Text role="alert" c="red" size="xs">
          {error}
        </Text>
      </Popover.Dropdown>
    </Popover>
  );
}
