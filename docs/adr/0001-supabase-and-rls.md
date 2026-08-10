# ADR 0001: Supabase and PostgreSQL RLS

- Status: accepted
- Date: 2026-08-10

## Context

The marketplace needs email authentication, relational constraints, and an
authorization boundary that remains effective when a client calls the Data API
directly. A separate custom API would add another service to operate.

## Decision

Use Supabase Auth and PostgreSQL. Keep UI reads and mutations in Next.js, but
make grants, constraints, and RLS the final data-access boundary. The runtime
uses only the publishable key; service-role access is limited to guarded test
and operator scripts.

## Alternatives and trade-offs

A custom Node API could centralize all authorization in application code, but
would duplicate identity and database plumbing and make a missed endpoint check
more dangerous. An ORM over a private database would improve portability but
would not provide RLS to direct browser clients. Supabase introduces platform
coupling and requires careful policy tests, accepted in exchange for a smaller
operational footprint and defense in depth.
