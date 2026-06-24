"""Companies module — Entity First (E1.5-REWORK).

Owns the persistent company entity view (`/empresa/{cif}`) including:
  - Section materialisation (identity, financials, score, comparables,
    valuation, narrative, actions).
  - Per-user conversation memory with the Company Advisor (a Copilot variant
    scoped to ONE company).
  - Watchlist + share toggles at org level.
  - Rate-limited refresh of the LLM-powered analysis section.

Boundary: this module does NOT read `master_companies_mock` directly; it goes
through the `agency_tool_adapter` like every other arroba.com module.
"""
