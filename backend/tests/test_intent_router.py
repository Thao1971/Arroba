"""Tests for the backend intent router. These verify:
  - the verb list keeps the same skill assignments as the TS one,
  - common Spanish phrasings route correctly,
  - ambiguous queries default to `search` (no LLM disambiguation on the
    backend router — Recommend's sub-router handles its own ambiguity).
"""
from src.modules.copilot.intent_router import VERB_PREFIXES, route_intent


def test_search_default_for_plain_query():
    assert route_intent("kitchen studio") == "search"
    assert route_intent("") == "search"
    assert route_intent("   ") == "search"


def test_analyze_verb_variants():
    assert route_intent("analiza Kitchen Studio") == "analyze"
    assert route_intent("Analizar Kitchen Studio") == "analyze"
    assert route_intent("ficha de Kitchen Studio") == "analyze"
    assert route_intent("analyze Kitchen Studio") == "analyze"


def test_value_verb_variants():
    assert route_intent("valora Kitchen Studio") == "value"
    assert route_intent("cuanto vale Kitchen Studio") == "value"
    assert route_intent("Cuánto vale Grupo Olmedo") == "value"
    assert route_intent("Valoración indicativa de Kitchen Studio") == "value"


def test_recommend_verb_variants():
    assert route_intent("empresas similares a Kitchen Studio") == "recommend"
    assert route_intent("Compañías parecidas a Kitchen Studio") == "recommend"
    assert route_intent("oportunidades en software") == "recommend"
    assert route_intent("empresas en alimentación") == "recommend"


def test_accent_insensitive():
    # "ñ", "á" etc. should not change the routing.
    assert route_intent("Compañías parecidas a Quickads") == "recommend"
    assert route_intent("Valoración de Kitchen Studio") == "value"
    assert route_intent("Análisis general") == "search"  # 'análisis' is NOT a verb


def test_verb_prefixes_disjoint_per_skill():
    """No verb appears in two skill buckets simultaneously."""
    seen: dict[str, str] = {}
    for kind, prefixes in VERB_PREFIXES.items():
        if kind == "search":
            continue
        for p in prefixes:
            assert p not in seen, f"verb '{p}' appears in both {seen[p]} and {kind}"
            seen[p] = kind


def test_verb_prefixes_are_normalised_lowercase_no_diacritics():
    import re
    import unicodedata

    def is_normalised(s: str) -> bool:
        nfd = unicodedata.normalize("NFD", s)
        if any(unicodedata.category(c) == "Mn" for c in nfd):
            return False
        if s != s.lower():
            return False
        if re.search(r"\s{2,}", s):
            return False
        return True

    for prefixes in VERB_PREFIXES.values():
        for p in prefixes:
            assert is_normalised(p), f"verb '{p}' is not pre-normalised"


def test_parity_with_frontend_verb_list():
    """The backend intent_router MUST stay in sync with the TS one. We check
    the file content directly to catch silent drifts during code review."""
    import re
    from pathlib import Path

    ts_path = Path("/app/frontend/src/lib/orchestrator/route-intent.ts")
    assert ts_path.exists(), "frontend route-intent.ts missing"
    ts_text = ts_path.read_text(encoding="utf-8")
    # Extract every quoted string inside each verb group.
    for kind, prefixes in VERB_PREFIXES.items():
        if kind == "search":
            continue
        # Find the kind: [ ... ] block.
        match = re.search(rf"{kind}:\s*\[(.*?)\]", ts_text, re.S)
        assert match, f"frontend block for {kind} missing"
        block = match.group(1)
        ts_verbs = re.findall(r"'([^']+)'", block)
        # Every Python verb MUST appear in the TS list.
        missing = [v for v in prefixes if v not in ts_verbs]
        assert not missing, f"Python verbs not in TS {kind} list: {missing}"
        extra = [v for v in ts_verbs if v not in prefixes]
        assert not extra, f"TS verbs not in Python {kind} list: {extra}"
