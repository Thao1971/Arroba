"""Intelligence Layer — capa de abstracción multi-proveedor sobre motores externos.

Fase B.6.a — Scaffolding sin llamadas HTTP reales.

Arquitectura (Regla canónica R9):
    interfaces/   → Contratos abstractos (MasterProvider, ...)
    providers/    → Implementaciones concretas
      mock/       → Lee master_companies_mock local
      agency_tool/→ Cliente HTTPX contra agencias.wearebudadvisors.com (real)
    router.py     → Dispatcher según AGENCY_TOOL_MODE (mock|real)
    cache.py      → Caché 2 capas (memory + Mongo) con single-flight
    circuit_breaker.py → Breaker propio async (closed|open|half_open)
    observability.py   → Métricas Prometheus + registry compartido
    config.py     → Settings específicas del módulo

Zero coupling superior: los consumidores solo tocan `router.py` (o el proxy REST).
Nada de este módulo conoce el nombre del proveedor final.
"""
