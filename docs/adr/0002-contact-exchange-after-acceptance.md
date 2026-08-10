# ADR 0002: Contact exchange after acceptance

- Status: accepted
- Date: 2026-08-10

## Context

Public contact details encourage scraping and bypass the marketplace decision
flow. Hiding them only in the UI would not protect direct database reads.

## Decision

Store private contacts separately from profiles. Reveal an explicitly enabled
contact only to the two participants after an investor request reaches the
terminal `accepted` state. Enforce the rule in RLS.

## Alternatives and trade-offs

Always-public contacts are simpler but create privacy and spam risk. An internal
messaging system would retain more control, but adds moderation, notification,
retention, and abuse complexity. Accepted-only exchange delays off-platform
conversation by one decision while keeping the beta small and consent-based.
