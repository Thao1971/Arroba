# Pending validation — market-async / commit `5861634`

**Fecha**: 2026-09-15
**Status**: Aprobado provisionalmente. NO desplegar en producción hasta cumplir el checklist de validación.
**Commit**: `5861634` sobre `cdc8470`.

## Aclaración crítica sobre el 520 actual

Beta Preview está llamando a:
```
CLIENT_BASE_URL=https://intel.arroba.com
```

Esto es **Intel PRODUCCIÓN**, NO Intel Preview. El 520 que veíamos en las validaciones **procede de Intel producción**, y es el comportamiento esperado hasta que `market-async` se despliegue en `intel.arroba.com`.

**NO investigar más el 520** hasta que Intel producción tenga `market-async` desplegado.

## Estado de los 2 commits (mantener separados)

- **`cdc8470`** — narrativa diferida inicial (background task + polling, contrato `{reading, status}`)
- **`5861634`** — adaptación al contrato `reading_status` de Intel, con loop interno + TTLs diferenciados (ready=1h / unavailable=5min / transient=5min)

**NO fusionar los 2 commits en un squash.** Cada uno resuelve un problema distinto y deben quedar trazables por separado.

## Trigger para reactivar validación

**Intel confirma que `market-async` está desplegado en `intel.arroba.com`** (prod).

## Checklist de validación cuando Intel prod esté activo

1. **Vaciar cache negativa in-memory de Beta Preview**:
   - Opción rápida: `sudo supervisorctl restart backend` (borra `_market_cache` del proceso Python)
   - Opción pasiva: esperar 5 min desde el último hit para que expire el TTL TRANSIENT
2. **Usar un CIF sin cache previa en `market_readings` de Intel** (para forzar el camino `pending → ready` completo). Sugerencia: pedirle a Daniel un CIF fresco no procesado aún.
3. **Ejecutar el ciclo completo y validar los 9 criterios**:
   - Primer hit Beta: `{"reading":null,"status":"pending"}`
   - Intel devuelve `reading_status="pending"` rápidamente en el primer poll interno
   - Los polls internos NO crean tareas duplicadas (`_inflight_market` con 1 sola entrada por CIF)
   - Intel termina en `reading_status="ready"` con `reading_ai` poblado
   - Beta responde `{"reading":"<texto>","status":"ready"}`
   - La narrativa aparece en la UI **sin recargar**
   - El polling frontend se detiene tras `ready`
   - Una recarga devuelve `ready` inmediatamente (cache in-memory 1h)
   - **CERO respuestas 502** en toda la sesión
4. **Registrar métricas** en el propio reporte de validación:
   - Tiempo total desde primer hit hasta `ready`
   - Número de llamadas Beta → Intel (deben ser 1 por cada poll de 3s dentro del task, sin duplicación)
   - Número de llamadas Frontend → Beta (deben ser 1 inicial + hasta 10 polls hasta terminal)
5. **Si el ciclo pasa**: `5861634` pasa a candidato de despliegue.

## Herramientas para la validación

- `e1_tester` con Playwright (browser-use) — para validar UI + Network
- Smoke curls JWT con `test.arroba+neo@arroba.com` — para validar backend puro
- Ver `/app/memory/test_credentials.md`

## No mezclar con el problema separado

- El caveat de `/ficha` fría 60s sin `?authenticated=true` es un problema APARTE, NO investigar como parte de este arreglo (directriz explícita de Daniel).

## Referencia rápida al código

- `backend/src/modules/copilot/intel_ficha_proxies.py` — TTLs en líneas ~72-74, `_fetch_market_async` con loop interno, `market_reading()` refactorizado
- `backend/src/modules/companies/router.py::get_market_reading` — devuelve 200 con `{reading, status}` siempre
- `frontend/src/components/company/CompanyFichaF01Client.tsx` — SWR de market-reading con `refreshInterval` inline (NO en `FETCH_CONFIG` compartido), `MARKET_MAX_ATTEMPTS=10`, label "Preparando lectura de mercado…"
