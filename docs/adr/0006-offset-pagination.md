# ADR 0006: Offset pagination for the beta

- Status: accepted
- Date: 2026-08-10

## Context

Directory and dashboard collections must be bounded. The beta also benefits
from simple numbered pages and exact result counts.

## Decision

Use validated page numbers, bounded PostgreSQL ranges, stable ordering, and an
exact count. Revisit cursor pagination when write volume, deep pages, or query
latency show that offset behavior is a real bottleneck.

## Alternatives and trade-offs

Cursor pagination scales better and avoids most shifts during concurrent
inserts, but complicates filters, back navigation, exact page counts, and URLs.
Offset pagination can shift rows and gets slower at deep offsets; those limits
are accepted for the current small, curated dataset.
