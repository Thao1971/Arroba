"""
NDA Mutuo Digital — ARROBA / BUD Advisors S.L.
Router, template, firma, PDF, email, auditoría.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from database import db
from routers.auth import get_current_user
from models.user import UserResponse
import uuid
import logging
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nda", tags=["NDA"])

# ─── NDA Template ───
NDA_TEMPLATE_VERSION = "2.0"
NDA_TEMPLATE_TITLE = "Acuerdo de Confidencialidad Mutuo"

NDA_LEGAL_TEXT = """
ACUERDO DE CONFIDENCIALIDAD MUTUO

Entre las partes:

(1) BUD ADVISORS, S.L. (en adelante, "ARROBA"), con CIF B70821400 y domicilio social en Paseo de la Castellana 178, 28046 Madrid, actuando como operador de la plataforma ARROBA.

(2) {signer_name}, con correo electrónico {signer_email}{signer_company_line} (en adelante, la "Parte Receptora").

(Cada una individualmente, una "Parte" y, conjuntamente, las "Partes").

En relación con la operación identificada como "{deal_reference}" dentro de la plataforma ARROBA (en adelante, la "Transacción Potencial").

EXPONEN

I. Que ARROBA opera una plataforma digital de intermediación confidencial para operaciones de compraventa y fusión de agencias digitales y compañías del ecosistema MadTech.

II. Que la Parte Receptora ha expresado interés en acceder a información relativa a la Transacción Potencial.

III. Que las Partes desean establecer el marco de confidencialidad aplicable al intercambio de información en el contexto de dicha Transacción Potencial.

ACUERDAN

1. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL

Se considerará "Información Confidencial" toda información, en cualquier formato o soporte, que cualquiera de las Partes facilite a la otra en relación con la Transacción Potencial, incluyendo sin limitación: datos financieros, operativos, comerciales, estratégicos, tecnológicos, legales, fiscales, organizativos, de recursos humanos, contractuales, así como cualquier análisis, estudio, informe, proyección o documento derivado de dicha información.

2. EXCLUSIONES

No se considerará Información Confidencial aquella que: (a) sea o pase a ser de dominio público sin mediar incumplimiento de este Acuerdo; (b) estuviese legítimamente en poder de la Parte Receptora con anterioridad a su recepción, sin obligación de confidencialidad; (c) sea desarrollada de forma independiente por la Parte Receptora sin utilizar la Información Confidencial; o (d) sea recibida legítimamente de un tercero sin restricción de divulgación.

3. DEBER DE CONFIDENCIALIDAD

Cada Parte se compromete a: (a) mantener en estricta confidencialidad toda la Información Confidencial recibida; (b) no divulgar dicha información a terceros salvo lo previsto en la cláusula 4; (c) utilizarla exclusivamente para evaluar o ejecutar la Transacción Potencial; (d) aplicar las medidas de protección razonables para evitar su divulgación no autorizada.

4. REVELACIÓN PERMITIDA

La Parte Receptora podrá revelar Información Confidencial a sus directivos, empleados, asesores legales, financieros o fiscales (los "Representantes") en la medida estrictamente necesaria para evaluar la Transacción Potencial, siempre que dichos Representantes estén sujetos a obligaciones de confidencialidad equivalentes a las aquí previstas. La Parte Receptora será responsable del cumplimiento de este Acuerdo por parte de sus Representantes.

5. PROHIBICIÓN DE DIVULGACIÓN DE LA EXISTENCIA DE CONVERSACIONES

Las Partes se comprometen a no divulgar a terceros la existencia de este Acuerdo, las conversaciones mantenidas en relación con la Transacción Potencial, ni el contenido de las mismas, salvo requerimiento legal o autorización expresa de la otra Parte.

6. DEVOLUCIÓN O DESTRUCCIÓN

Cuando cualquiera de las Partes lo solicite, o una vez finalizada la evaluación de la Transacción Potencial sin acuerdo, la Parte Receptora procederá a devolver o destruir toda la Información Confidencial recibida, incluidas las copias, salvo aquella cuya conservación sea exigida por ley o regulación aplicable.

7. TITULARIDAD

La divulgación de Información Confidencial no supone cesión de derechos de propiedad intelectual, industrial ni de ningún otro tipo sobre la misma. La Parte que divulga conserva íntegramente la titularidad de su información.

8. VIGENCIA

Las obligaciones de confidencialidad previstas en este Acuerdo permanecerán vigentes durante un período de dos (2) años desde la fecha de firma, con independencia de que la Transacción Potencial se materialice o no.

9. LEGISLACIÓN APLICABLE Y JURISDICCIÓN

El presente Acuerdo se rige por la legislación española. Para la resolución de cualquier controversia derivada de su interpretación o cumplimiento, las Partes se someten expresamente a la jurisdicción de los Juzgados y Tribunales de la ciudad de Madrid, con renuncia a cualquier otro fuero que pudiera corresponderles.

10. FIRMA ELECTRÓNICA

Las Partes reconocen y aceptan la validez de la firma electrónica del presente Acuerdo, realizada a través de la plataforma ARROBA, como expresión válida de su consentimiento.

---

Firmado electrónicamente:

Por la Parte Receptora:
Nombre: {signer_name}
Email: {signer_email}
Fecha: {signed_date}
Hora: {signed_time}

Sello de verificación:
Firmado electrónicamente por {signer_name} desde {signer_email} el {signed_date} a las {signed_time} (IP: {signed_ip})
Identificador de firma: {signature_id}
Versión del documento: {template_version}

Por ARROBA (BUD Advisors, S.L.):
Plataforma digital de intermediación confidencial.
CIF: B70821400
"""


# ─── Schemas ───
class NdaSignRequest(BaseModel):
    deal_id: str
    signer_name: str = Field(..., min_length=1)
    signer_company: Optional[str] = None
    signer_title: Optional[str] = None
    accept_terms: bool = Field(..., description="Must be true")


class NdaSendEmailRequest(BaseModel):
    signature_id: str


# ─── Seed template ───
async def seed_nda_template():
    existing = await db.nda_templates.find_one({"version": NDA_TEMPLATE_VERSION}, {"_id": 0})
    if existing:
        return
    await db.nda_templates.insert_one({
        "template_id": f"nda_tmpl_{uuid.uuid4().hex[:8]}",
        "title": NDA_TEMPLATE_TITLE,
        "version": NDA_TEMPLATE_VERSION,
        "language": "es",
        "role_type": "buyer",
        "content_text": NDA_LEGAL_TEXT,
        "is_mutual": True,
        "jurisdiction": "Madrid, España",
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


# ─── Helpers ───
def _render_nda(signer_name, signer_email, signer_company, deal_reference, signature_id, signed_at, signed_ip):
    """Render the NDA text with all fields filled."""
    company_line = f", en representación de {signer_company}" if signer_company else ""
    dt = datetime.fromisoformat(signed_at) if isinstance(signed_at, str) else signed_at
    return NDA_LEGAL_TEXT.format(
        signer_name=signer_name,
        signer_email=signer_email,
        signer_company_line=company_line,
        deal_reference=deal_reference,
        signed_date=dt.strftime("%d/%m/%Y"),
        signed_time=dt.strftime("%H:%M:%S UTC"),
        signed_ip=signed_ip,
        signature_id=signature_id,
        template_version=NDA_TEMPLATE_VERSION,
    )


def _generate_pdf(rendered_text, signer_name, signature_id):
    """Generate a simple PDF from the rendered NDA text."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.units import cm
        from reportlab.lib.enums import TA_JUSTIFY

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                leftMargin=2.5 * cm, rightMargin=2.5 * cm,
                                topMargin=2.5 * cm, bottomMargin=2.5 * cm)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('NDATitle', parent=styles['Title'], fontSize=14, spaceAfter=20, fontName='Helvetica-Bold')
        body_style = ParagraphStyle('NDABody', parent=styles['Normal'], fontSize=9, leading=13, alignment=TA_JUSTIFY, spaceAfter=6)
        bold_style = ParagraphStyle('NDABold', parent=body_style, fontName='Helvetica-Bold', fontSize=10, spaceAfter=8, spaceBefore=12)
        seal_style = ParagraphStyle('NDASeal', parent=body_style, fontSize=8, fontName='Helvetica-Oblique', textColor='#666666')

        story = []
        lines = rendered_text.strip().split('\n')
        for line in lines:
            stripped = line.strip()
            if not stripped:
                story.append(Spacer(1, 6))
            elif stripped.startswith('ACUERDO DE CONFIDENCIALIDAD'):
                story.append(Paragraph(stripped, title_style))
            elif stripped[0].isdigit() and '.' in stripped[:4] and stripped.split('.')[0].strip().isdigit():
                story.append(Paragraph(stripped, bold_style))
            elif stripped.startswith('EXPONEN') or stripped.startswith('ACUERDAN') or stripped.startswith('---'):
                story.append(Spacer(1, 8))
                if stripped != '---':
                    story.append(Paragraph(stripped, bold_style))
            elif stripped.startswith('Sello de verificación') or stripped.startswith('Firmado electrónicamente por'):
                story.append(Paragraph(stripped, seal_style))
            else:
                safe = stripped.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(safe, body_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    except ImportError:
        logger.warning("reportlab not installed — PDF generation skipped")
        return None


async def _log_event(signature_id, event_type, metadata=None):
    await db.nda_events.insert_one({
        "event_id": f"nda_evt_{uuid.uuid4().hex[:10]}",
        "signature_id": signature_id,
        "event_type": event_type,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


# ─── Endpoints ───
@router.get("/template/{deal_id}")
async def get_nda_template(deal_id: str, user: UserResponse = Depends(get_current_user)):
    """Get the NDA template rendered with known data for preview."""
    from database import deals_collection
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal no encontrado")

    deal_ref = deal.get("title", deal_id)
    signer_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email

    preview = _render_nda(
        signer_name=signer_name,
        signer_email=user.email,
        signer_company="[Tu empresa]",
        deal_reference=deal_ref,
        signature_id="[pendiente]",
        signed_at=datetime.now(timezone.utc).isoformat(),
        signed_ip="[pendiente]",
    )
    return {
        "template_version": NDA_TEMPLATE_VERSION,
        "title": NDA_TEMPLATE_TITLE,
        "is_mutual": True,
        "jurisdiction": "Madrid, España",
        "rendered_text": preview,
        "signer_name_prefill": signer_name,
        "signer_email": user.email,
    }


@router.post("/sign")
async def sign_nda(payload: NdaSignRequest, request: Request, user: UserResponse = Depends(get_current_user)):
    """Sign the NDA — creates signature record, generates PDF, logs event."""
    if not payload.accept_terms:
        raise HTTPException(400, "Debes aceptar los términos del NDA")

    from database import deals_collection, users_collection
    deal = await deals_collection.find_one({"deal_id": payload.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal no encontrado")
    if deal.get("status") == "draft":
        raise HTTPException(400, "El deal aún no está publicado")

    # Check existing
    existing = await db.nda_signatures.find_one(
        {"deal_id": payload.deal_id, "buyer_user_id": user.user_id, "status": "signed"},
        {"_id": 0}
    )
    if existing:
        return {"message": "NDA ya firmado", "signature_id": existing["signature_id"], "has_access": True}

    # Collect metadata
    now = datetime.now(timezone.utc)
    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for", "")
    real_ip = forwarded.split(",")[0].strip() if forwarded else client_ip
    user_agent = request.headers.get("user-agent", "")

    signature_id = f"nda_sig_{uuid.uuid4().hex[:12]}"
    deal_ref = deal.get("title", payload.deal_id)

    # Render final NDA
    rendered = _render_nda(
        signer_name=payload.signer_name,
        signer_email=user.email,
        signer_company=payload.signer_company,
        deal_reference=deal_ref,
        signature_id=signature_id,
        signed_at=now.isoformat(),
        signed_ip=real_ip,
    )

    # Generate PDF
    pdf_bytes = _generate_pdf(rendered, payload.signer_name, signature_id)
    pdf_url = None
    if pdf_bytes:
        try:
            from services.storage_service import upload_bytes
            pdf_url = upload_bytes(pdf_bytes, f"ndas/{signature_id}.pdf", "application/pdf")
        except Exception as e:
            logger.warning(f"PDF upload failed: {e}")

    # Save signature
    sig_doc = {
        "signature_id": signature_id,
        "deal_id": payload.deal_id,
        "buyer_user_id": user.user_id,
        "company_id": deal.get("company_id"),
        "template_version": NDA_TEMPLATE_VERSION,
        "signer_name": payload.signer_name,
        "signer_email": user.email,
        "signer_company": payload.signer_company,
        "signer_title": payload.signer_title,
        "signed_at": now.isoformat(),
        "signed_timezone": "UTC",
        "signed_ip": real_ip,
        "user_agent": user_agent,
        "rendered_text": rendered,
        "pdf_url": pdf_url,
        "email_sent": False,
        "email_sent_at": None,
        "status": "signed",
        "created_at": now.isoformat(),
    }
    await db.nda_signatures.insert_one(sig_doc)

    # Update deal ndas_signed (keep backward compat with existing flow)
    nda_record = {"buyer_id": user.user_id, "signed_at": now.isoformat(), "ip": real_ip, "document_id": signature_id}
    already_in_deal = any(n.get("buyer_id") == user.user_id for n in deal.get("ndas_signed", []))
    if not already_in_deal:
        await deals_collection.update_one(
            {"deal_id": payload.deal_id},
            {"$push": {"ndas_signed": nda_record}, "$inc": {"metrics.ndas_signed_count": 1}, "$set": {"updated_at": now.isoformat()}}
        )

    # Log event
    await _log_event(signature_id, "NDA_SIGNED", {
        "deal_id": payload.deal_id, "signer_email": user.email, "ip": real_ip,
    })

    # Notify seller
    try:
        from services.notification_service import notify_nda_signed
        from services.email_service import send_email
        buyer_name = payload.signer_name
        await notify_nda_signed(deal["owner_id"], payload.deal_id, user.user_id, buyer_name)
        seller = await users_collection.find_one({"user_id": deal["owner_id"]}, {"_id": 0})
        if seller:
            await send_email(seller.get("email", ""), "NDA_SIGNED", {
                "seller_name": seller.get("first_name", ""),
                "buyer_name": buyer_name,
                "deal_title": deal_ref,
                "deal_url": f"/seller/deal/{payload.deal_id}",
            })
    except Exception as e:
        logger.warning(f"NDA notification error: {e}")

    # Auto-send result email to buyer
    try:
        from services.email_service import send_email
        await send_email(user.email, "NDA_BUYER_SIGNED", {
            "name": payload.signer_name,
            "deal_title": deal_ref,
            "signature_id": signature_id,
            "signed_date": now.strftime("%d/%m/%Y"),
            "signed_time": now.strftime("%H:%M:%S UTC"),
        })
        await db.nda_signatures.update_one(
            {"signature_id": signature_id},
            {"$set": {"email_sent": True, "email_sent_at": now.isoformat()}}
        )
        await _log_event(signature_id, "EMAIL_SENT", {"to": user.email})
    except Exception as e:
        logger.warning(f"NDA email error: {e}")

    return {
        "message": "NDA firmado correctamente",
        "signature_id": signature_id,
        "has_access": True,
        "pdf_url": pdf_url,
    }


@router.get("/{signature_id}/pdf")
async def get_nda_pdf(signature_id: str, user: UserResponse = Depends(get_current_user)):
    """Download the signed NDA as PDF."""
    sig = await db.nda_signatures.find_one({"signature_id": signature_id}, {"_id": 0})
    if not sig:
        raise HTTPException(404, "Firma no encontrada")
    if sig["buyer_user_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")

    if sig.get("pdf_url"):
        return {"pdf_url": sig["pdf_url"]}

    # Regenerate from rendered text
    rendered = sig.get("rendered_text", "")
    if not rendered:
        raise HTTPException(404, "Documento no disponible")

    pdf_bytes = _generate_pdf(rendered, sig["signer_name"], signature_id)
    if not pdf_bytes:
        raise HTTPException(500, "No se pudo generar el PDF")

    await _log_event(signature_id, "PDF_DOWNLOADED", {"user_id": user.user_id})
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="NDA_{signature_id}.pdf"'}
    )


@router.post("/{signature_id}/send-email")
async def send_nda_email(signature_id: str, user: UserResponse = Depends(get_current_user)):
    """Re-send the NDA confirmation email."""
    sig = await db.nda_signatures.find_one({"signature_id": signature_id}, {"_id": 0})
    if not sig:
        raise HTTPException(404, "Firma no encontrada")
    if sig["buyer_user_id"] != user.user_id:
        raise HTTPException(403, "No autorizado")

    try:
        from services.email_service import send_email
        await send_email(user.email, "NDA_BUYER_SIGNED", {
            "name": sig["signer_name"],
            "deal_title": sig.get("deal_id", ""),
            "signature_id": signature_id,
            "signed_date": sig.get("signed_at", "")[:10],
            "signed_time": sig.get("signed_at", "")[11:19],
        })
        now = datetime.now(timezone.utc).isoformat()
        await db.nda_signatures.update_one(
            {"signature_id": signature_id},
            {"$set": {"email_sent": True, "email_sent_at": now}}
        )
        await _log_event(signature_id, "EMAIL_RESENT", {"to": user.email})
    except Exception as e:
        logger.warning(f"NDA email resend error: {e}")

    return {"status": "sent", "message": "Email enviado"}


@router.get("/my-signatures")
async def get_my_signatures(user: UserResponse = Depends(get_current_user)):
    """List all NDAs signed by the current user."""
    cursor = db.nda_signatures.find(
        {"buyer_user_id": user.user_id}, {"_id": 0, "rendered_text": 0}
    ).sort("signed_at", -1)
    return await cursor.to_list(length=100)
