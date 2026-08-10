"""EPHEMERAL · Audit endpoints Intel para B-2. Borrable tras uso.

Uso: cd /app/backend && python scripts/b2_intel_audit.py
Salida: JSON en stdout con matriz de resultados por endpoint × CIF.
"""
import asyncio
import json
import sys
import time
from pathlib import Path

# Cargar .env sin depender de pydantic
env_path = Path("/app/backend/.env")
for line in env_path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    import os
    os.environ.setdefault(k, v)

sys.path.insert(0, "/app/backend")

from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

# Muestra de CIFs — mix representativo (grande cotizada, mid, SME)
CIFS = {
    "B28184687": "LABORATORIOS SERVIER (pharma · mid-large · MADRID · CNAE 2120)",
    "A08363419": "GRUPO PLANETA-DE AGOSTINI (media · large · BARCELONA)",
    "A28017895": "IBERDROLA (utilities · IBEX · VIZCAYA)",
    "B65076193": "TECHNIP IBERIA (energy engineering · SME · BARCELONA)",
    "B95758389": "SME aleatorio (microempresa)",
}

# Endpoints candidatos B-2 con múltiples patrones a probar
# (label, method, path_template, body_template)
# path_template puede contener {cif} y {buyer_id}
CANDIDATES = [
    # === Grupo A ===
    # Ranking embebido en analyze.ranking (POST financial-intelligence/analyze) — ya validado; solo re-probamos el sub-doc
    ("A1_analyze_full",           "POST", "/api/v1/financial-intelligence/analyze",           {"identifier": "{cif}"}),
    # Ownership
    ("A2a_ownership_v1",          "GET",  "/api/v1/company/{cif}/ownership",                   None),
    ("A2b_ownership_v2",          "POST", "/api/v2/company-intelligence/ownership",            {"identifier": "{cif}"}),
    ("A2c_ownership_intel",       "POST", "/api/v1/ownership-intelligence/analyze",            {"identifier": "{cif}"}),
    # Governance
    ("A3a_governance_v1",         "GET",  "/api/v1/company/{cif}/governance",                  None),
    ("A3b_governance_v2",         "POST", "/api/v2/company-intelligence/governance",           {"identifier": "{cif}"}),
    ("A3c_governance_intel",      "POST", "/api/v1/governance-intelligence/analyze",           {"identifier": "{cif}"}),
    # Events
    ("A4a_events_v1",             "GET",  "/api/v1/company/{cif}/events",                      None),
    ("A4b_events_v2",             "POST", "/api/v2/company-intelligence/events",               {"identifier": "{cif}"}),
    ("A4c_events_intel",          "POST", "/api/v1/events-intelligence/analyze",               {"identifier": "{cif}"}),
    # Control-synergy (buyer_id se resuelve dinámicamente)
    ("A5_control_synergy",        "GET",  "/api/v1/company/{cif}/control-synergy/{buyer_id}",  None),
    ("A5b_control_synergy_intel", "POST", "/api/v1/control-synergy-intelligence/analyze",      {"identifier": "{cif}", "buyer_id": "{buyer_id}"}),

    # === Grupo B ===
    ("B6a_sector_v1",             "GET",  "/api/v1/company/{cif}/sector-intelligence",         None),
    ("B6b_sector_intel",          "POST", "/api/v1/sector-intelligence/analyze",               {"identifier": "{cif}"}),
    ("B7a_geo_v1",                "GET",  "/api/v1/company/{cif}/geo-intelligence",            None),
    ("B7b_geo_intel",             "POST", "/api/v1/geo-intelligence/analyze",                  {"identifier": "{cif}"}),
    ("B8a_economic_v1",           "GET",  "/api/v1/company/{cif}/economic-intelligence",       None),
    ("B8b_economic_intel",        "POST", "/api/v1/economic-intelligence/analyze",             {"identifier": "{cif}"}),

    # === Grupo C ===
    ("C9a_watchlist_v1",          "GET",  "/api/v1/watchlist",                                  None),
    ("C9b_watchlist_v2",          "GET",  "/api/v2/watchlist",                                  None),
    ("C10a_alerts_v1",            "GET",  "/api/v1/alerts",                                     None),
    ("C10b_alerts_v2",            "GET",  "/api/v2/alerts",                                     None),
    ("C11a_company_state",        "GET",  "/api/v1/company/{cif}/state",                        None),
    ("C11b_company_state_v2",     "GET",  "/api/v2/company-intelligence/state",                 None),

    # === Grupo D ===
    ("D12a_ficha_agregador_v1",   "GET",  "/api/v1/company/{cif}/ficha",                        None),
    ("D12b_ficha_agregador_v2",   "GET",  "/api/v2/company-intelligence/ficha",                 None),
    ("D12c_dossier",              "GET",  "/api/v1/company/{cif}/dossier",                      None),
]


def render(tpl, cif, buyer_id=None):
    if tpl is None:
        return None
    if isinstance(tpl, str):
        return tpl.format(cif=cif, buyer_id=buyer_id or "UNKNOWN")
    if isinstance(tpl, dict):
        return {k: (v.format(cif=cif, buyer_id=buyer_id or "UNKNOWN") if isinstance(v, str) else v) for k, v in tpl.items()}
    return tpl


def keys_at(obj, path=""):
    """Recolecta claves top-level de un objeto anidado (nivel 1 y sub-dicts nivel 2)."""
    out = {}
    if not isinstance(obj, dict):
        return out
    for k, v in obj.items():
        p = f"{path}.{k}" if path else k
        if v is None:
            out[p] = "null"
        elif isinstance(v, dict):
            out[p] = f"dict(k={list(v.keys())[:6]})"
        elif isinstance(v, list):
            out[p] = f"list(n={len(v)})"
            if v and isinstance(v[0], dict):
                out[p] += f" sample_keys={list(v[0].keys())[:6]}"
        else:
            out[p] = type(v).__name__
    return out


def count_null(obj):
    """Cuenta % de campos null en el primer nivel."""
    if not isinstance(obj, dict):
        return None
    total = 0
    nulls = 0
    for _, v in obj.items():
        total += 1
        if v is None or (isinstance(v, (list, dict, str)) and len(v) == 0):
            nulls += 1
    return round(nulls / max(1, total) * 100)


async def probe_one(client, label, method, path_tpl, body_tpl, cif, buyer_id=None):
    path = render(path_tpl, cif, buyer_id) if path_tpl else None
    body = render(body_tpl, cif, buyer_id) if body_tpl else None
    result = {
        "label": label,
        "cif": cif,
        "method": method,
        "path": path,
        "buyer_id": buyer_id,
        "status": None,
        "latency_ms": None,
        "payload_bytes": 0,
        "top_keys": None,
        "null_pct": None,
        "sample": None,
        "error": None,
    }
    try:
        t0 = time.perf_counter()
        resp = await client.request(method, path, json=body if method == "POST" else None)
        result["latency_ms"] = round((time.perf_counter() - t0) * 1000)
        result["status"] = resp.status_code
        result["payload_bytes"] = len(resp.content)
        try:
            data = resp.json()
            result["top_keys"] = list(data.keys())[:12] if isinstance(data, dict) else f"{type(data).__name__}({len(data) if isinstance(data, (list, dict)) else '?'})"
            result["null_pct"] = count_null(data)
            # Sample recortado
            s = json.dumps(data, ensure_ascii=False)[:800]
            result["sample"] = s
        except Exception:
            result["sample"] = resp.text[:400]
    except AgencyToolHTTPError as e:
        result["status"] = e.status_code
        result["error"] = f"{e.error_class}: {str(e)[:200]}"
    except asyncio.TimeoutError:
        result["error"] = "timeout"
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {str(e)[:200]}"
    return result


async def get_buyer_id_for(client, cif):
    """Fetch buyer_id top desde recommendation-intelligence/buyers."""
    try:
        resp = await client.request("POST", "/api/v1/recommendation-intelligence/buyers",
                                     json={"identifier": cif, "limit": 1})
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("buyers") or data.get("items") or []
            if items:
                b = items[0]
                return b.get("cif_normalized") or b.get("cif") or b.get("id") or b.get("identifier") or b.get("master_id")
    except Exception:
        pass
    return None


async def main():
    client = get_agency_tool_client()
    all_results = []
    buyer_id_cache = {}

    for cif in CIFS:
        # Precomputa buyer_id para control-synergy
        buyer_id = await get_buyer_id_for(client, cif)
        buyer_id_cache[cif] = buyer_id
        print(f"# CIF={cif} · buyer_id={buyer_id!r}", file=sys.stderr)

        for label, method, path_tpl, body_tpl in CANDIDATES:
            # Skip control-synergy si no hay buyer_id
            if "control-synergy" in label and not buyer_id:
                r = {"label": label, "cif": cif, "status": None, "error": "no_buyer_id_available"}
                all_results.append(r)
                continue
            r = await probe_one(client, label, method, path_tpl, body_tpl, cif, buyer_id)
            all_results.append(r)
            print(f"  {label:<28} {r['method']:<5} {r['status']!s:>5} lat={r['latency_ms']!s:>4}ms bytes={r['payload_bytes']:>6}  {r['error'] or ''}", file=sys.stderr)

    # Close client
    if client._client is not None:
        await client._client.aclose()

    print(json.dumps({"cifs": CIFS, "buyer_ids": buyer_id_cache, "results": all_results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
