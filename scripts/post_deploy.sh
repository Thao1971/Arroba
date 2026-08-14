#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# arroba.com · post_deploy.sh · HARDENING-005 (2026-08-13) · HARDENING-028 (2026-08-14)
# ══════════════════════════════════════════════════════════════════════════════
#
# Orquesta el flujo post-deploy PROD:
#   0) [HARDENING-028] Rebuild+restart local del frontend (dev pod). Previene el
#      "next-server crash-loop tras yarn build" (Next.js production mode cachea
#      manifest+chunks en memoria y no hot-reloadea con nuevos builds sin
#      restart). Ver DEPLOY_NOTES.md · "Regla operativa preview dev".
#   a) Purga selectiva del `intelligence_cache` (engine=ficha).
#   b) Smoke: 5 checks contra endpoints reales de https://beta.arroba.com.
#   6) [HARDENING-028] Smoke retry con backoff exponencial contra
#      /api/platform/stats — detecta la ventana de crash-loop de arranque en
#      Prod tras deploy antes de que un usuario la vea (5s → 10s → 20s → 40s
#      → 80s → 160s = ~5 min total). Sale con exit 1 si tras 6 intentos sigue
#      en 5xx.
#   c) Resumen OK/FAIL por check + exit-code no-cero si CUALQUIER smoke falla.
#
# Idempotente y seguro re-ejecutar (la purga sobre cache vacío es no-op, el
# rebuild es determinista, el smoke retry sólo hace GET reads).
#
# Uso:
#   export ARROBA_ADMIN_TOKEN="<token-de-panel-emergent>"
#   bash scripts/post_deploy.sh
#
# Overrides opcionales:
#   ARROBA_BASE_URL       (default: https://beta.arroba.com)
#   SMOKE_CIF             (default: B28184687 · Servier)
#   SMOKE_TIMEOUT_S       (default: 20)
#   SKIP_LOCAL_REBUILD    (default: 0 · pon a 1 para saltar Paso 0)
# ══════════════════════════════════════════════════════════════════════════════

set -uo pipefail
# NB: no `set -e`; queremos ejecutar TODOS los checks y agregar fallos.

BASE_URL="${ARROBA_BASE_URL:-https://beta.arroba.com}"
CIF="${SMOKE_CIF:-B28184687}"
TIMEOUT="${SMOKE_TIMEOUT_S:-20}"
FAILS=0
CHECKS=()

# ─── Utilidades ──────────────────────────────────────────────────────────────
red()   { printf '\033[31m%s\033[0m' "$1"; }
green() { printf '\033[32m%s\033[0m' "$1"; }
yellow(){ printf '\033[33m%s\033[0m' "$1"; }
bold()  { printf '\033[1m%s\033[0m' "$1"; }

log_step() { echo; echo "$(bold "▸ $1")"; }
log_ok()   { CHECKS+=("$(green OK)   :: $1"); }
log_fail() { CHECKS+=("$(red FAIL) :: $1"); FAILS=$((FAILS + 1)); }

require_env() {
  if [[ -z "${!1:-}" ]]; then
    echo "$(red 'ERROR')  Variable de entorno requerida: $1"
    echo "  Exporta el token y vuelve a lanzar. Ejemplo:"
    echo "    export $1='<valor>'"
    exit 2
  fi
}

# `jq` opcional. Si no está, hacemos parsing con grep -o (menos elegante).
have_jq() { command -v jq >/dev/null 2>&1; }

# ─── Pre-flight ──────────────────────────────────────────────────────────────
log_step "Pre-flight"
require_env ARROBA_ADMIN_TOKEN
echo "  BASE_URL=$BASE_URL"
echo "  CIF=$CIF"
echo "  TIMEOUT=${TIMEOUT}s"

# ─── (0) LOCAL REBUILD+RESTART FRONTEND ──────────────────────────────────────
# HARDENING-028 · Rebuild fresco del `.next/` local + restart de supervisor.
# Motivo: Next.js con `next start` cachea el manifest en memoria del proceso
# Node; sin restart tras `yarn build` el pod dev sigue sirviendo el bundle
# anterior (ver DEPLOY_NOTES.md · "Regla operativa preview dev"). Idempotente:
# rebuild sobre `.next` existente es determinista; restart es seguro. Saltable
# con `SKIP_LOCAL_REBUILD=1` si el usuario ya lo hizo manualmente.
if [[ "${SKIP_LOCAL_REBUILD:-0}" != "1" ]]; then
  log_step "(0) Rebuild+restart local del frontend (dev pod)"
  if [[ -d /app/frontend ]]; then
    ( cd /app/frontend && yarn build 2>&1 | tail -12 ) || {
      echo "$(red 'FAIL')  yarn build local devolvió no-cero"
      log_fail "step0 :: yarn build local falló"
      # No abortamos — el resto del script sirve para diagnosticar Prod aunque
      # el dev pod tenga problemas.
    }
    if command -v sudo >/dev/null 2>&1 && command -v supervisorctl >/dev/null 2>&1; then
      sudo supervisorctl restart frontend >/dev/null 2>&1 && sleep 3
      echo "  supervisor frontend restarted"
      log_ok "step0 :: yarn build + supervisor restart frontend"
    else
      echo "  (skip supervisor restart · sudo/supervisorctl no disponibles)"
      log_ok "step0 :: yarn build local (sin restart supervisor)"
    fi
  else
    echo "  (skip · /app/frontend no existe en este entorno)"
  fi
else
  echo "  (skipped · SKIP_LOCAL_REBUILD=1)"
fi

# ─── (a) PURGE ───────────────────────────────────────────────────────────────
log_step "(a) Purga intelligence_cache · engine=ficha"
PURGE_JSON=$(curl -sS --max-time "$TIMEOUT" \
  -X POST "$BASE_URL/api/admin/cache/purge" \
  -H "X-Admin-Token: $ARROBA_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"engine":"ficha"}' 2>&1) || {
    echo "$(red 'FAIL')  Purga cache no respondió (network/timeout)"
    log_fail "purge :: request no completó"
    PURGE_JSON=""
  }

if [[ -n "$PURGE_JSON" ]]; then
  echo "  respuesta: $PURGE_JSON"
  # Verifica ok:true
  if echo "$PURGE_JSON" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
    log_ok "purge :: engine=ficha OK ($(echo "$PURGE_JSON" | grep -oE '"deleted":[0-9]+' | head -1 || echo 'deleted=?'))"
  else
    log_fail "purge :: respuesta no contiene ok:true"
  fi
fi

# ─── (b) SMOKE · 5 checks ────────────────────────────────────────────────────
log_step "(b) Smoke · 5 checks contra $BASE_URL"

# Check 1 · Health del backend responde 200.
echo; echo "  [1/5] Backend health"
HEALTH_CODE=$(curl -sS -o /tmp/_health.json -w "%{http_code}" --max-time "$TIMEOUT" \
  "$BASE_URL/api/health") || HEALTH_CODE="000"
echo "        HTTP=$HEALTH_CODE"
if [[ "$HEALTH_CODE" == "200" ]]; then
  if grep -q '"status"[[:space:]]*:[[:space:]]*"ok"' /tmp/_health.json 2>/dev/null; then
    log_ok "smoke#1 backend health :: HTTP 200 + status:ok"
  else
    log_fail "smoke#1 backend health :: HTTP 200 pero body sin status:ok"
  fi
else
  log_fail "smoke#1 backend health :: HTTP $HEALTH_CODE (esperado 200)"
fi

# Check 2 · Ficha ANON responde 200 (DPD gate activo).
echo; echo "  [2/5] Ficha anon /api/companies/$CIF/ficha (sin cookie)"
ANON_CODE=$(curl -sS -o /tmp/_ficha_anon.json -w "%{http_code}" --max-time "$TIMEOUT" \
  "$BASE_URL/api/companies/$CIF/ficha") || ANON_CODE="000"
echo "        HTTP=$ANON_CODE"
if [[ "$ANON_CODE" == "200" ]]; then
  # DPD: finances debería ser null para anon
  if grep -qE '"finances"[[:space:]]*:[[:space:]]*null' /tmp/_ficha_anon.json; then
    log_ok "smoke#2 ficha anon :: HTTP 200 + finances=null (DPD OK)"
  else
    log_fail "smoke#2 ficha anon :: HTTP 200 pero finances NO es null (posible fuga DPD)"
  fi
else
  log_fail "smoke#2 ficha anon :: HTTP $ANON_CODE (esperado 200)"
fi

# Check 3 · Ficha anon expone identity.legal_name (público).
echo; echo "  [3/5] identity.legal_name presente en anon"
if grep -qE '"legal_name"[[:space:]]*:[[:space:]]*"[^"]+"' /tmp/_ficha_anon.json 2>/dev/null; then
  LEGAL=$(grep -oE '"legal_name"[[:space:]]*:[[:space:]]*"[^"]+"' /tmp/_ficha_anon.json | head -1)
  echo "        $LEGAL"
  log_ok "smoke#3 identity.legal_name :: presente en anon"
else
  log_fail "smoke#3 identity.legal_name :: ausente/null en anon"
fi

# Check 4 · OpenAPI expone /api/admin/cache/purge (verifica que el endpoint HARDENING-004
# quedó registrado tras el deploy).
echo; echo "  [4/5] OpenAPI expone /api/admin/cache/purge"
OA_CODE=$(curl -sS -o /tmp/_openapi.json -w "%{http_code}" --max-time "$TIMEOUT" \
  "$BASE_URL/api/openapi.json") || OA_CODE="000"
if [[ "$OA_CODE" == "200" ]] && grep -q '"/api/admin/cache/purge"' /tmp/_openapi.json 2>/dev/null; then
  log_ok "smoke#4 openapi :: HARDENING-004 endpoint registrado"
else
  log_fail "smoke#4 openapi :: /api/admin/cache/purge NO expuesto (HTTP $OA_CODE)"
fi

# Check 5 · Frontend responde 200 en la ficha (Next.js SSR/SSG ping).
# NB: es un smoke de ruta, NO verifica render. El render se valida a mano.
echo; echo "  [5/5] Frontend renderiza /es/empresa-f01/$CIF"
FE_CODE=$(curl -sS -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" \
  -H "Accept: text/html" \
  "$BASE_URL/es/empresa-f01/$CIF") || FE_CODE="000"
echo "        HTTP=$FE_CODE"
if [[ "$FE_CODE" == "200" ]]; then
  log_ok "smoke#5 frontend ficha :: HTTP 200"
else
  log_fail "smoke#5 frontend ficha :: HTTP $FE_CODE (esperado 200)"
fi

# ─── (6) SMOKE RETRY BACKOFF ─────────────────────────────────────────────────
# HARDENING-028 · Detecta la ventana de crash-loop del container Prod tras
# deploy (patrón "Could not find a production build in .next" con next start
# reiniciando en bucle) antes de que un usuario lo vea. Reintentos
# exponenciales: 5s → 10s → 20s → 40s → 80s → 160s = ~5 min total. Sale con
# exit 1 (dentro del contador FAILS del resumen) si tras 6 intentos sigue en
# 5xx. Prueba contra /api/platform/stats porque es endpoint público sin auth
# y consulta el estado real del backend (mongo + Intel client).
log_step "(6) Smoke retry backoff · $BASE_URL/api/platform/stats"
max_attempts=6
delay=5
retry_ok=0
for i in $(seq 1 "$max_attempts"); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" \
    "$BASE_URL/api/platform/stats") || code="000"
  if [[ "$code" == "200" ]]; then
    echo "  attempt $i → HTTP 200 OK"
    retry_ok=1
    break
  fi
  if [[ "$i" == "$max_attempts" ]]; then
    echo "  attempt $i → HTTP $code · sin más reintentos"
    break
  fi
  echo "  attempt $i → HTTP $code · reintenta en ${delay}s"
  sleep "$delay"
  delay=$((delay * 2))
done
if [[ "$retry_ok" == "1" ]]; then
  log_ok "smoke#6 retry backoff :: /api/platform/stats OK en $i intento(s)"
else
  log_fail "smoke#6 retry backoff :: /api/platform/stats sigue en HTTP $code tras $max_attempts intentos (~5 min)"
fi

# ─── (c) NOTIFY · resumen ────────────────────────────────────────────────────
log_step "(c) Resumen"
for line in "${CHECKS[@]}"; do echo "  $line"; done
echo
if [[ "$FAILS" -eq 0 ]]; then
  echo "  $(green '● POST-DEPLOY OK') · ${#CHECKS[@]} checks pasados · cache purgada · smoke verde."
  exit 0
else
  echo "  $(red "● POST-DEPLOY FAIL") · $FAILS/${#CHECKS[@]} checks fallidos."
  echo "  Revisa los mensajes arriba y consulta panel Emergent · logs backend."
  exit 1
fi
