import { LinkButton } from "@/components/link-button";
import { Group, Text } from "@mantine/core";

type PaginationNavProps = {
  page: number;
  pageCount: number;
  total: number;
  previousHref?: string;
  nextHref?: string;
  itemLabel: string;
};

export function PaginationNav({
  page,
  pageCount,
  total,
  previousHref,
  nextHref,
  itemLabel,
}: PaginationNavProps) {
  if (pageCount <= 1) return null;

  return (
    <Group component="nav" aria-label="Pagination" justify="space-between" mt="xl">
      <div>
        {previousHref && (
          <LinkButton href={previousHref} variant="outline">
            Previous
          </LinkButton>
        )}
      </div>
      <Text size="sm" c="dimmed" ta="center">
        Page {page} of {pageCount} · {total} {itemLabel}
      </Text>
      <div>
        {nextHref && (
          <LinkButton href={nextHref} variant="outline">
            Next
          </LinkButton>
        )}
      </div>
    </Group>
  );
}
