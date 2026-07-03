"""Entities module — resolución genérica multi-tipo.

Endpoints canónicos:
  - GET /api/entities/lookup?q&types&limit

Diseño (Sprint 1):
  - Solo `company` implementado. El resto de tipos (sector, territory,
    person, advisor, mandate, match, operation, valuation, document,
    opportunity) devuelven [] sin fallar, dejando el contrato genérico
    listo para sprints futuros (Regla 2 del brief).
"""
from src.modules.entities.router import router

__all__ = ["router"]
