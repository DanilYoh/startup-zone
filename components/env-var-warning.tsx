import { Badge, Button, Group } from "@mantine/core";

export function EnvVarWarning() {
  return (
    <Group gap="xs" wrap="nowrap" title="Add the variables from .env.example to enable authentication">
      <Badge variant="outline" color="gray" className="hidden font-normal lg:block">
        Demo mode
      </Badge>
      <Button size="compact-sm" variant="outline" disabled>
        Sign in
      </Button>
    </Group>
  );
}
