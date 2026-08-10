# ADR 0003: Immutable marketplace roles

- Status: accepted
- Date: 2026-08-10

## Context

Founder and investor permissions, profile fields, and marketplace actions are
different. Allowing a user to switch roles after creating records complicates
ownership, audit meaning, and policy evaluation.

## Decision

Choose founder or investor during invitation-bound registration and make the
role immutable. A person who genuinely needs both roles uses separately
approved accounts. The historical `specialist` enum value remains only for
non-destructive schema compatibility and has no active permissions.

## Alternatives and trade-offs

Mutable roles improve convenience but require migration of dependent records
and careful revocation of old capabilities. Multi-role accounts reduce account
count but make every policy and UI branch more complex. Separate immutable roles
are less flexible but easier to explain, test, and audit during the beta.
