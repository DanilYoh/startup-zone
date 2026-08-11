# Founder and investor profile structure

Startup Zone profiles are decision tools, not generic social profiles. Every
field should help the other marketplace role answer one of three questions:

1. Is this person credible?
2. Is there a relevant fit?
3. Is a conversation worth starting now?

## Shared identity layer

Both roles have the same compact identity foundation:

- **Full name** — the stable display identity.
- **Professional headline** — a one-line role and focus statement.
- **About** — a concise point of view rather than a full résumé.
- **Location** — useful context for geography and meeting expectations.
- **Avatar and LinkedIn URL** — optional public verification links.

Email is an account credential, displayed only to its owner in profile editing.
The marketplace role is assigned during registration and cannot be changed.

Each user also controls a separate private contact record. A contact email and
optional public HTTPS contact link remain unavailable to anonymous visitors, profile
browsers, pending requests, rejected requests, and unrelated authenticated
users. When sharing is enabled, the database reveals those details only to the
other participant in an accepted investor-interest request. Disabling sharing
prevents future reads, but cannot revoke a contact that a recipient already
saved after an earlier authorized view.

## Founder profile

A founder profile establishes the credibility of the person behind a project:

- shared identity fields;
- **relevant founder experience**: domain expertise, previous products,
  customer access, or a hard-won market insight;
- links to one or more persisted startup pages owned by the founder.

The founder profile must not duplicate the startup pitch. Product summary,
problem, market, niche, stage, traction narrative, funding ask, equity, website,
and deck belong to the startup record so they remain searchable, comparable,
and independently manageable.

## Investor profile

An investor profile makes the investment mandate explicit:

- shared identity fields;
- **fund or organization** and its public website;
- **investment thesis**: what the investor backs, why now, and the attributes of
  a strong fit;
- **preferred stages** using the same stage taxonomy as startup records;
- **minimum and maximum ticket** in USD.

Portfolio examples, geography, lead/follow preference, and value-add categories
are sensible future extensions. They should be added only with corresponding
search or qualification behavior, rather than as unused profile decoration.

## Visibility and authorization

- A user can edit only their own profile and cannot change its role.
- Anonymous users cannot browse the profiles table.
- Public startup pages expose only the founder name, professional headline,
  founder experience, and location through a deliberately narrow view.
- A founder can read an investor profile only when that investor has sent an
  interest request to one of the founder's startups.
- Only investors can create interest requests; only the owning founder can make
  the terminal accept or reject decision.
- Accepted founders and investors can read the other participant's explicitly
  enabled private contact details; every other application state remains closed.

The database retains a historical `specialist` enum label to avoid destructive
rewrites of already-applied databases. It is not an active product role: new
onboarding and profile inserts reject it, it cannot create marketplace
activity, and current UI and queries do not expose a specialist workflow.
