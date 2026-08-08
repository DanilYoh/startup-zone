import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex items-center gap-2" title="Add the variables from .env.example to enable authentication">
      <Badge variant="outline" className="hidden font-normal lg:inline-flex">
        Demo mode
      </Badge>
      <Button size="sm" variant="outline" disabled>
        Sign in
      </Button>
    </div>
  );
}
