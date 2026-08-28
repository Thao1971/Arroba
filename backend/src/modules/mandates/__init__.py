"""Módulo `mandates` — proxy Beta → Intel `buyer-mandates` (E1 · G1).

Cierra la costura identificada en la auditoría de la página Oportunidades
(2026-08-20, `arroba.com/DIAGNOSTICO_PAGINA_OPORTUNIDADES.md`): el motor
mandato→universo YA EXISTE en Intel (`Intel-140826/backend/routes/buyer_mandates.py`,
`GET /api/v1/buyer-mandates/{id}/targets`) pero Beta no lo consumía — el
resolver de `entities.service._resolve_stub` para el tipo `mandate` siempre
devolvía `[]`.

Este módulo NO recalcula nada: crea/lee mandatos y pide candidatos rankeados
al motor real de Intel. En modo mock (default) sirve datos representativos
sin llamar a ningún servicio externo, mismo patrón que `intelligence_layer`.
"""
