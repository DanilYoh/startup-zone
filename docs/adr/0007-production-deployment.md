# ADR 0007: Single-node production deployment

- Status: accepted
- Date: 2026-08-10

## Context

The closed beta needs a low-cost Russia-hosted topology with TLS, application,
Auth, PostgreSQL, recovery, and clear operational ownership. Expected traffic
does not yet justify a distributed platform.

## Decision

Run a Next.js standalone container and the pinned official self-hosted Supabase
bundle behind Caddy on one appropriately sized VPS. Keep databases private,
store encrypted backups off-host, distinguish liveness from readiness, and use
additive database roll-forward plus application rollback to a reviewed commit.

## Alternatives and trade-offs

Managed services reduce operational work but may conflict with data-location,
cost, or provider requirements. Multiple nodes improve availability but add
replication, routing, deployment, and recovery complexity. The single node is a
known failure domain, accepted only for closed beta with monitoring and tested
off-host restore procedures.
