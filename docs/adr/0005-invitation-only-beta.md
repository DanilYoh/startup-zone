# ADR 0005: Invitation-only beta

- Status: accepted
- Date: 2026-08-10

## Context

An early two-sided marketplace benefits more from curated liquidity and direct
feedback than from unrestricted account volume. Legal documents and operator
processes also require a fail-closed launch gate.

## Decision

Require a one-time, expiring, email- and role-bound invitation for every real
registration. Store only its SHA-256 hash and consume it atomically in the Auth
trigger. Offer separate shared synthetic demo accounts for portfolio review.

## Alternatives and trade-offs

Open signup reduces acquisition friction but increases spam, moderation load,
and low-quality supply. A static allowlist is easy but has poor expiry and audit
semantics. Invitations add an operator step and constrain growth, intentionally
matching the curated beta strategy.
