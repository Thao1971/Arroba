"""
Subagente 2: Acceso y Reglas por Plan — Modelo de estado por modulo.
Cada modulo puede estar en: open, preview, preview_locked, contact_required, nda_required, plan_required, hidden_only_if_no_data
"""

MODULE_STATES = ["open", "preview", "preview_locked", "contact_required", "nda_required", "plan_required", "hidden_only_if_no_data"]

# Which modules exist at which gating level
GATING = {
    # module_id: { gate_type, min_tier_for_preview, min_tier_for_open, requires_nda_for_open }
    "hero":              {"gate": None},
    "executive_summary": {"gate": "contact", "preview_tier": "free", "open_tier": "pro"},
    "business_snapshot": {"gate": "contact", "preview_tier": "free", "open_tier": "pro"},
    "financial_evolution":{"gate": "plan",   "preview_tier": "pro",  "open_tier": "pro"},
    "pnl":               {"gate": "nda",    "preview_tier": "pro",  "open_tier": "pro"},
    "balance":           {"gate": "nda",    "preview_tier": "pro",  "open_tier": "pro"},
    "charts":            {"gate": "plan",   "preview_tier": "pro",  "open_tier": "pro"},
    "qualitative":       {"gate": "contact","preview_tier": "free", "open_tier": "pro"},
    "visual_assets":     {"gate": "contact","preview_tier": "free", "open_tier": "free"},
    "infomemo":          {"gate": "nda",    "preview_tier": "pro",  "open_tier": "pro"},
    "dataroom":          {"gate": "nda",    "preview_tier": "pro",  "open_tier": "pro"},
    "actions_panel":     {"gate": None},
    "process_state":     {"gate": None},
    "affinity":          {"gate": None},
    "trust_footer":      {"gate": None},
    "premium_analysis":  {"gate": "plan",   "preview_tier": "pro+", "open_tier": "pro+"},
}

TIER_ORDER = {"free": 0, "pro": 1, "pro+": 2}

UNLOCK_COPY = {
    "contact_required": {"label": "Contactar para desbloquear", "description": "Solicita acceso al vendedor para ver este contenido."},
    "nda_required":     {"label": "Firmar NDA para desbloquear", "description": "Accede al detalle completo tras firmar el acuerdo de confidencialidad."},
    "plan_required":    {"label": "Disponible desde Pro", "description": "Actualiza tu plan para acceder a este contenido."},
    "plan_required_pro+": {"label": "Exclusivo Pro+", "description": "Contenido premium disponible con el plan Pro+."},
}


def compute_module_states(
    buyer_tier: str,
    contact_state: str | None,
    has_nda: bool,
    has_data: dict,
) -> dict:
    """Compute per-module state for the deal presentation."""

    tier_level = TIER_ORDER.get(buyer_tier, 0)
    contact_accepted = contact_state == "accepted"
    contact_pending = contact_state == "pending"

    modules = {}

    for mod_id, config in GATING.items():
        # Skip if no data for this module
        if not has_data.get(mod_id, False):
            modules[mod_id] = {"state": "hidden_only_if_no_data"}
            continue

        gate = config.get("gate")

        # No gate — always open
        if gate is None:
            modules[mod_id] = {"state": "open"}
            continue

        preview_tier = TIER_ORDER.get(config.get("preview_tier", "free"), 0)
        open_tier = TIER_ORDER.get(config.get("open_tier", "pro"), 1)

        # Determine state
        if has_nda and tier_level >= open_tier:
            state = "open"
        elif has_nda and tier_level < open_tier:
            # Has NDA but tier too low (e.g. Free with legacy NDA)
            state = "plan_required"
        elif contact_accepted and tier_level >= open_tier and gate == "contact":
            state = "open"
        elif contact_accepted and tier_level >= preview_tier:
            if gate == "nda":
                state = "nda_required"
            elif gate == "plan" and tier_level < open_tier:
                state = "plan_required"
            else:
                state = "preview" if tier_level < open_tier else "open"
        elif contact_pending:
            state = "contact_required"
        elif tier_level >= preview_tier and gate != "nda":
            state = "preview_locked"
        else:
            state = "contact_required"

        # Build module entry
        entry = {"state": state}

        if state in ("preview_locked", "contact_required", "nda_required", "plan_required"):
            if state == "nda_required":
                copy = UNLOCK_COPY["nda_required"]
                entry["unlock_condition"] = "signed_nda"
                entry["cta_action"] = "sign_nda"
            elif state == "plan_required":
                if mod_id == "premium_analysis":
                    copy = UNLOCK_COPY["plan_required_pro+"]
                    entry["unlock_condition"] = "pro+"
                    entry["cta_action"] = "upgrade_pro+"
                else:
                    copy = UNLOCK_COPY["plan_required"]
                    entry["unlock_condition"] = "pro_or_higher"
                    entry["cta_action"] = "upgrade_pro"
            elif state == "contact_required":
                copy = UNLOCK_COPY["contact_required"]
                entry["unlock_condition"] = "contact_accepted"
                entry["cta_action"] = "contact_request"
            else:  # preview_locked
                copy = UNLOCK_COPY["contact_required"]
                entry["unlock_condition"] = "contact_accepted"
                entry["cta_action"] = "contact_request"

            entry["cta_label"] = copy["label"]
            entry["cta_description"] = copy["description"]

        modules[mod_id] = entry

    return modules


def compute_visibility_state(buyer_tier: str, contact_state: str | None, has_nda: bool) -> str:
    """Compute the top-level visibility state."""
    tier = buyer_tier
    if tier == "free":
        if contact_state == "accepted":
            return "TEASER_UNLOCKED"
        elif contact_state == "pending":
            return "CONTACT_REQUESTED"
        return "LOCKED_CONTACT_REQUIRED"
    else:
        if has_nda:
            return "OPERATIVE_ACCESS"
        elif contact_state == "accepted":
            return "NDA_AVAILABLE"
        elif contact_state == "pending":
            return "CONTACT_REQUESTED"
        return "LOCKED_CONTACT_REQUIRED"


def get_buyer_tier_from_plan(plan_type: str) -> str:
    pt = (plan_type or "").lower().replace(" ", "")
    if "proplus" in pt or "pro+" in pt:
        return "pro+"
    if "pro" in pt:
        return "pro"
    return "free"
