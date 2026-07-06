"""Proveedor mock — lee `master_companies_mock` local.

Rol: mantener la app viva durante la migración B.6.a → B.6.f. Traduce los
10 campos actuales al schema §6.1 rellenando lo ausente con `null`/`[]`.

**NO se inventan datos**. Sin CAGR, sin scores sintéticos, sin substring
lookups (Regla R4).
"""
