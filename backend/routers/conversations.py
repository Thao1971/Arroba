"""
Q&A Workspace — Structured Questions & Answers between Buyer and Seller.
NOT a chat. A traceable repository of questions/answers per deal+buyer.

Business rule: Conversation auto-created when seller accepts buyer interest (SHORTLISTED).
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import uuid

from database import db
from models.user import UserResponse
from routers.auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["Q&A Workspace"])

conversations_collection = db.conversations
qa_items_collection = db.qa_items


# --- Models ---

class QuestionCreate(BaseModel):
    content: str

class AnswerCreate(BaseModel):
    content: str


# --- Helpers ---

async def _get_conversation(conversation_id: str):
    conv = await conversations_collection.find_one(
        {"conversation_id": conversation_id}, {"_id": 0}
    )
    if not conv:
        raise HTTPException(404, "Conversacion no encontrada")
    return conv


def _check_buyer_access(conv: dict, user_id: str):
    if conv["buyer_id"] != user_id and conv["seller_id"] != user_id:
        raise HTTPException(403, "Sin acceso a esta conversacion")


async def create_conversation_for_engagement(
    deal_id: str, buyer_id: str, seller_id: str, engagement_id: str
):
    """Auto-create conversation when seller accepts buyer interest."""
    existing = await conversations_collection.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_id}, {"_id": 0}
    )
    if existing:
        return existing["conversation_id"]

    now = datetime.now(timezone.utc).isoformat()
    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"

    doc = {
        "conversation_id": conversation_id,
        "deal_id": deal_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "engagement_id": engagement_id,
        "status": "OPEN",
        "created_at": now,
        "updated_at": now,
        "last_activity_at": now,
        "stats": {"questions": 0, "pending": 0, "answered": 0, "closed": 0},
    }
    await conversations_collection.insert_one(doc)

    # Event
    from routers.tracking import track_event
    await track_event("CONVERSATION_CREATED", deal_id=deal_id,
                      user_id=seller_id, metadata={"buyer_id": buyer_id})

    return conversation_id


# --- Endpoints ---

@router.get("/deal/{deal_id}")
async def get_deal_conversations(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all conversations for a deal (seller sees all, buyer sees own)."""
    query = {"deal_id": deal_id}
    if current_user.role == "buyer":
        query["buyer_id"] = current_user.user_id

    cursor = conversations_collection.find(query, {"_id": 0}).sort("last_activity_at", -1)
    convs = await cursor.to_list(50)

    # Enrich with buyer/seller names
    for c in convs:
        buyer = await db.users.find_one({"user_id": c["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        seller = await db.users.find_one({"user_id": c["seller_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        c["buyer_name"] = f"{buyer['first_name']} {buyer['last_name']}" if buyer else c["buyer_id"]
        c["seller_name"] = f"{seller['first_name']} {seller['last_name']}" if seller else c["seller_id"]

    return {"conversations": convs, "total": len(convs)}


@router.get("/my")
async def get_my_conversations(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all conversations for current user (buyer or seller)."""
    query = {"$or": [
        {"buyer_id": current_user.user_id},
        {"seller_id": current_user.user_id}
    ]}
    cursor = conversations_collection.find(query, {"_id": 0}).sort("last_activity_at", -1)
    convs = await cursor.to_list(100)

    # Enrich with names and deal titles
    for c in convs:
        buyer = await db.users.find_one({"user_id": c["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        seller = await db.users.find_one({"user_id": c["seller_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        deal = await db.deals.find_one({"deal_id": c["deal_id"]}, {"_id": 0, "teaser": 1})
        c["buyer_name"] = f"{buyer['first_name']} {buyer['last_name']}" if buyer else c["buyer_id"]
        c["seller_name"] = f"{seller['first_name']} {seller['last_name']}" if seller else c["seller_id"]
        c["deal_title"] = deal.get("teaser", {}).get("headline", c["deal_id"]) if deal else c["deal_id"]

    return {"conversations": convs, "total": len(convs)}


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get conversation detail with all Q&A items."""
    conv = await _get_conversation(conversation_id)
    _check_buyer_access(conv, current_user.user_id)

    # Enrich with names and deal info
    buyer = await db.users.find_one({"user_id": conv["buyer_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
    seller = await db.users.find_one({"user_id": conv["seller_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
    deal = await db.deals.find_one({"deal_id": conv["deal_id"]}, {"_id": 0, "teaser": 1, "status": 1})
    conv["buyer_name"] = f"{buyer['first_name']} {buyer['last_name']}" if buyer else conv["buyer_id"]
    conv["seller_name"] = f"{seller['first_name']} {seller['last_name']}" if seller else conv["seller_id"]
    conv["deal_title"] = deal.get("teaser", {}).get("headline", conv["deal_id"]) if deal else conv["deal_id"]
    conv["deal_status"] = deal.get("status") if deal else ""

    # Get Q&A items
    cursor = qa_items_collection.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1)
    items = await cursor.to_list(500)

    # Enrich items with author names
    user_cache = {}
    for item in items:
        uid = item["author_user_id"]
        if uid not in user_cache:
            u = await db.users.find_one({"user_id": uid}, {"_id": 0, "first_name": 1, "last_name": 1, "role": 1})
            user_cache[uid] = {
                "name": f"{u['first_name']} {u['last_name']}" if u else uid,
                "role": u.get("role", "") if u else ""
            }
        item["author_name"] = user_cache[uid]["name"]
        item["author_role"] = user_cache[uid]["role"]

    # Group: questions with their answers
    questions = []
    answer_map = {}
    for item in items:
        if item["type"] == "ANSWER":
            pid = item.get("parent_question_id")
            if pid:
                answer_map.setdefault(pid, []).append(item)
        else:
            questions.append(item)

    for q in questions:
        q["answers"] = answer_map.get(q["qa_item_id"], [])

    return {"conversation": conv, "questions": questions}


@router.post("/{conversation_id}/questions")
async def create_question(
    conversation_id: str,
    body: QuestionCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer submits a question."""
    conv = await _get_conversation(conversation_id)
    _check_buyer_access(conv, current_user.user_id)

    if conv["status"] == "CLOSED":
        raise HTTPException(400, "Conversacion cerrada")

    if current_user.user_id != conv["buyer_id"]:
        raise HTTPException(403, "Solo el buyer puede crear preguntas")

    content = body.content.strip()
    if not content:
        raise HTTPException(400, "Contenido vacio")

    now = datetime.now(timezone.utc).isoformat()
    qa_id = f"qa_{uuid.uuid4().hex[:12]}"

    item = {
        "qa_item_id": qa_id,
        "conversation_id": conversation_id,
        "type": "QUESTION",
        "parent_question_id": None,
        "author_user_id": current_user.user_id,
        "content": content,
        "status": "PENDING",
        "created_at": now,
        "updated_at": now,
    }
    await qa_items_collection.insert_one(item)

    # Update conversation stats and last_activity
    await conversations_collection.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"last_activity_at": now, "updated_at": now},
         "$inc": {"stats.questions": 1, "stats.pending": 1}}
    )

    # Event + Notification for seller
    from routers.tracking import track_event
    await track_event("QUESTION_SUBMITTED", deal_id=conv["deal_id"],
                      user_id=current_user.user_id,
                      metadata={"conversation_id": conversation_id, "qa_item_id": qa_id})

    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": conv["seller_id"],
        "type": "NEW_QUESTION",
        "title": "Nueva pregunta recibida",
        "message": f"Tienes una nueva pregunta en el Q&A del deal",
        "deal_id": conv["deal_id"],
        "metadata": {"conversation_id": conversation_id, "qa_item_id": qa_id},
        "read": False,
        "created_at": now,
    })

    item.pop("_id", None)
    return {"qa_item": item}


@router.post("/{conversation_id}/answers")
async def create_answer(
    conversation_id: str,
    body: AnswerCreate,
    question_id: str = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller answers a question."""
    conv = await _get_conversation(conversation_id)
    _check_buyer_access(conv, current_user.user_id)

    if conv["status"] == "CLOSED":
        raise HTTPException(400, "Conversacion cerrada")

    if current_user.user_id != conv["seller_id"]:
        raise HTTPException(403, "Solo el seller puede responder")

    if not question_id:
        raise HTTPException(400, "question_id requerido")

    content = body.content.strip()
    if not content:
        raise HTTPException(400, "Contenido vacio")

    # Verify question exists
    question = await qa_items_collection.find_one(
        {"qa_item_id": question_id, "conversation_id": conversation_id, "type": "QUESTION"},
        {"_id": 0}
    )
    if not question:
        raise HTTPException(404, "Pregunta no encontrada")

    now = datetime.now(timezone.utc).isoformat()
    qa_id = f"qa_{uuid.uuid4().hex[:12]}"

    item = {
        "qa_item_id": qa_id,
        "conversation_id": conversation_id,
        "type": "ANSWER",
        "parent_question_id": question_id,
        "author_user_id": current_user.user_id,
        "content": content,
        "status": "ANSWERED",
        "created_at": now,
        "updated_at": now,
    }
    await qa_items_collection.insert_one(item)

    # Update question status
    await qa_items_collection.update_one(
        {"qa_item_id": question_id},
        {"$set": {"status": "ANSWERED", "updated_at": now}}
    )

    # Update conversation stats
    await conversations_collection.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"last_activity_at": now, "updated_at": now},
         "$inc": {"stats.answered": 1, "stats.pending": -1}}
    )

    # Event + Notification for buyer
    from routers.tracking import track_event
    await track_event("ANSWER_SUBMITTED", deal_id=conv["deal_id"],
                      user_id=current_user.user_id,
                      metadata={"conversation_id": conversation_id, "qa_item_id": qa_id})

    await db.notifications.insert_one({
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": conv["buyer_id"],
        "type": "NEW_ANSWER",
        "title": "Respuesta recibida",
        "message": f"Han respondido a tu pregunta en el Q&A",
        "deal_id": conv["deal_id"],
        "metadata": {"conversation_id": conversation_id, "qa_item_id": qa_id},
        "read": False,
        "created_at": now,
    })

    item.pop("_id", None)
    return {"qa_item": item}


@router.post("/{conversation_id}/close/{question_id}")
async def close_question(
    conversation_id: str,
    question_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller closes a question (marks as resolved)."""
    conv = await _get_conversation(conversation_id)

    if current_user.user_id != conv["seller_id"]:
        raise HTTPException(403, "Solo el seller puede cerrar preguntas")

    question = await qa_items_collection.find_one(
        {"qa_item_id": question_id, "conversation_id": conversation_id, "type": "QUESTION"},
        {"_id": 0}
    )
    if not question:
        raise HTTPException(404, "Pregunta no encontrada")

    if question["status"] == "CLOSED":
        raise HTTPException(400, "Pregunta ya cerrada")

    now = datetime.now(timezone.utc).isoformat()

    was_pending = question["status"] == "PENDING"

    await qa_items_collection.update_one(
        {"qa_item_id": question_id},
        {"$set": {"status": "CLOSED", "updated_at": now}}
    )

    inc_update = {"stats.closed": 1}
    if was_pending:
        inc_update["stats.pending"] = -1
    else:
        inc_update["stats.answered"] = -1

    await conversations_collection.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"last_activity_at": now, "updated_at": now},
         "$inc": inc_update}
    )

    from routers.tracking import track_event
    await track_event("QUESTION_CLOSED", deal_id=conv["deal_id"],
                      user_id=current_user.user_id,
                      metadata={"conversation_id": conversation_id, "qa_item_id": question_id})

    return {"message": "Pregunta cerrada"}
