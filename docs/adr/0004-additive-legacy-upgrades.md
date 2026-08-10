# ADR 0004: Additive legacy-schema upgrades

- Status: accepted
- Date: 2026-08-10

## Context

An early April schema can contain incomplete startup and application rows. Later
migrations require stronger constraints without losing those records or
rewriting migration history already present in deployed databases.

## Decision

Keep applied migrations immutable. Use an additive bridge migration to
normalize and backfill legacy values before validating constraints. Test the
path from the immutable April version with a destructive fixture only on a
disposable local database, and test clean installation independently.

## Alternatives and trade-offs

Rewriting the first migration produces a clean history but makes existing
databases diverge. Dropping legacy rows is simpler but destroys user data. A
one-off manual repair is hard to reproduce. The bridge adds compatibility SQL
and permanent history, accepted for deterministic, reviewable upgrades.
