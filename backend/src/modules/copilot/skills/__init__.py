"""Copilot Skills (E1.4+). Each Skill takes a request, fetches data from the
Boundary First adapters (EnrichCompanyAdapter), optionally calls the configured
LLMProvider, and returns a fully materialised `Workspace`.

Skills NEVER read database collections directly — they go through the
adapters. This keeps the swap "mock → real" trivial and tests cheap.
"""
