"""Tests for `_taxonomy_retry_variant` (copilot search, rama categórica).

HARDENING-2026-08-24 · bug reportado: "agencias marketing" no devolvía
resultados en la búsqueda categórica (rama #3 de `execute_search`), pero
"agencias de marketing" sí. Causa: el endpoint de taxonomía de Intel
matchea por frase contra el nombre canónico de la categoría ("Agencias DE
marketing"), y Beta mandaba el texto del usuario sin normalizar. Esta
función genera una variante con "de" insertado entre las 2 primeras
palabras, que `execute_search` reintenta si la primera llamada no
devuelve filas — ver `service.py` rama "#3 · CATEGORICAL".

Es una función pura (sin I/O), así que se testea aislada del resto del
skill (que si necesita red/mocks de Intel).
"""
from src.modules.copilot.service import _taxonomy_retry_variant


def test_inserts_de_between_first_two_words():
    assert _taxonomy_retry_variant("agencias marketing") == "agencias de marketing"


def test_inserts_de_preserving_rest_of_query():
    assert (
        _taxonomy_retry_variant("empresas construccion Madrid")
        == "empresas de construccion Madrid"
    )


def test_returns_none_when_connector_already_present():
    assert _taxonomy_retry_variant("agencias de marketing") is None
    assert _taxonomy_retry_variant("clinicas en Madrid") is None
    assert _taxonomy_retry_variant("empresas del sector textil") is None


def test_returns_none_for_single_word():
    assert _taxonomy_retry_variant("marketing") is None
    assert _taxonomy_retry_variant("") is None


def test_returns_none_for_empty_or_whitespace():
    assert _taxonomy_retry_variant("   ") is None
