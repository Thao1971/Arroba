"""EPHEMERAL · Deep dive Servier B28184687 sobre los 5 endpoints que responden 200 + buyer discovery."""
import asyncio, json, sys, time
from pathlib import Path

env_path = Path("/app/backend/.env")
import os
for line in env_path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    os.environ.setdefault(k, v)

sys.path.insert(0, "/app/backend")

from src.modules.intelligence_layer.providers.agency_tool.client import get_agency_tool_client, AgencyToolHTTPError

CIF = "B28184687"

ENDPOINTS = [
    ("ownership",     "GET",  f"/api/v1/company/{CIF}/ownership"),
    ("governance",    "GET",  f"/api/v1/company/{CIF}/governance"),
    ("events",        "GET",  f"/api/v1/company/{CIF}/events"),
    ("ficha_full",    "GET",  f"/api/v1/company/{CIF}/ficha"),
    ("analyze_full",  "POST", "/api/v1/financial-intelligence/analyze"),
    # Probamos también recommendation-intelligence/buyers para resolver buyer_id
    ("buyers",        "POST", "/api/v1/recommendation-intelligence/buyers"),
]

async def main():
    c = get_agency_tool_client()
    dumps = {}
    for name, method, path in ENDPOINTS:
        try:
            if name == "buyers":
                resp = await c.request(method, path, json={"identifier": CIF, "limit": 3})
            elif name == "analyze_full":
                resp = await c.request(method, path, json={"identifier": CIF})
            else:
                resp = await c.request(method, path)
            dumps[name] = {"status": resp.status_code, "bytes": len(resp.content), "data": resp.json() if resp.status_code == 200 else resp.text}
        except AgencyToolHTTPError as e:
            dumps[name] = {"status": e.status_code, "error": str(e)}
        except Exception as e:
            dumps[name] = {"error": str(e)}

    # Extraer buyer_id
    buyer_id = None
    b = dumps.get("buyers", {}).get("data", {})
    if isinstance(b, dict):
        for key in ("buyers", "items", "results", "data"):
            arr = b.get(key)
            if isinstance(arr, list) and arr:
                first = arr[0]
                buyer_id = first.get("master_id") or first.get("cif_normalized") or first.get("cif") or first.get("id")
                print(f"BUYER_TOP keys: {list(first.keys())[:10]}", file=sys.stderr)
                break

    # Si hay buyer_id, probamos control-synergy
    if buyer_id:
        for path in [f"/api/v1/company/{CIF}/control-synergy/{buyer_id}",
                     f"/api/v1/control-synergy/{CIF}/{buyer_id}",
                     f"/api/v1/synergy/{CIF}/{buyer_id}"]:
            try:
                resp = await c.request("GET", path)
                dumps[f"control_synergy_{path.split('/')[3]}"] = {"path": path, "status": resp.status_code, "bytes": len(resp.content), "data": resp.json() if resp.status_code == 200 else resp.text[:400]}
            except AgencyToolHTTPError as e:
                dumps[f"control_synergy_{path.split('/')[3]}"] = {"path": path, "status": e.status_code, "error": str(e)[:200]}
    print("BUYER_ID:", buyer_id, file=sys.stderr)

    if c._client:
        await c._client.aclose()
    print(json.dumps(dumps, ensure_ascii=False, default=str, indent=2))

asyncio.run(main())
