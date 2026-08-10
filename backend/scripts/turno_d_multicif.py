"""Ephemeral · Turno D · batería multi-CIF diagnóstica.
Consume el agregador Intel `/company/{cif}/ficha` y otros endpoints intel para
producir la matriz maestra. NO modifica estado de la app.
"""
from __future__ import annotations
import json
import os
import sys
import time
import urllib.request

INTEL = "https://intel.arroba.com"
KEY = "as_ace1afcc17a0901743f629b3cca64aa4314f433669"
CIFS = [
    ("B28031458", "NCR ESPAÑA"),
    ("B50949346", "OPEL EUROPE HOLDINGS"),
    ("A81921611", "PROCOLUIDE INDUSTRIAL"),
    ("B82229907", "FARNELL COMPONENTS"),
    ("V83153700", "AGRUPACIÓN IUSTIME"),
    ("A28354132", "COTIZADA"),
]

def _req(method, path, body=None):
    url = INTEL + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("X-API-Key", KEY)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body_bytes = resp.read()
            dt = time.time() - t0
            return resp.status, dt, body_bytes
    except urllib.error.HTTPError as e:
        dt = time.time() - t0
        return e.code, dt, e.read()
    except Exception as e:  # pragma: no cover
        dt = time.time() - t0
        return -1, dt, str(e).encode()

def ficha(cif):
    return _req("GET", f"/api/v1/company/{cif}/ficha")

def signals(cif):
    return _req("POST", "/api/v1/signal-intelligence/analyze", body={"identifier": cif})

def buyers(cif):
    return _req("POST", "/api/v1/recommendation-intelligence/buyers", body={"identifier": cif})

def control_synergy(cif, buyer_id):
    return _req("POST", "/api/v1/recommendation-intelligence/control-synergy",
                body={"source_cif": cif, "target_cif": buyer_id})

if __name__ == "__main__":
    out = {"cifs": {}}
    for cif, name in CIFS:
        row = {"name": name, "checks": {}}
        # ficha
        code, dt, body = ficha(cif)
        row["checks"]["ficha"] = {"http": code, "ms": round(dt * 1000, 1), "size": len(body)}
        if code == 200:
            try:
                d = json.loads(body)
                row["ficha"] = d
            except Exception as e:
                row["ficha_error"] = str(e)
        # signals
        code, dt, body = signals(cif)
        row["checks"]["signals"] = {"http": code, "ms": round(dt * 1000, 1), "size": len(body)}
        try:
            row["signals"] = json.loads(body) if code == 200 else None
        except Exception:
            row["signals"] = None
        # buyers
        code, dt, body = buyers(cif)
        row["checks"]["buyers"] = {"http": code, "ms": round(dt * 1000, 1), "size": len(body)}
        try:
            row["buyers"] = json.loads(body) if code == 200 else None
        except Exception:
            row["buyers"] = None
        out["cifs"][cif] = row

    # control-synergy solo para IUSTIME · usa buyer top si existe
    iustime = out["cifs"].get("V83153700", {})
    buyers_data = iustime.get("buyers") or {}
    recs = buyers_data.get("recommendations") if isinstance(buyers_data, dict) else None
    top_buyer = None
    if isinstance(recs, list) and recs:
        top_buyer = recs[0].get("cif") or recs[0].get("target_cif") or recs[0].get("identifier")
    if top_buyer:
        code, dt, body = control_synergy("V83153700", top_buyer)
        out["control_synergy_iustime"] = {
            "top_buyer": top_buyer,
            "http": code,
            "ms": round(dt * 1000, 1),
            "size": len(body),
        }
        try:
            out["control_synergy_iustime"]["body"] = json.loads(body)
        except Exception:
            out["control_synergy_iustime"]["body_raw"] = body.decode("utf-8", errors="ignore")[:400]

    with open("/tmp/turno_d.json", "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print("saved /tmp/turno_d.json")
