from datetime import datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Conversation, Session
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import session_service
from app.services.gemini_service import generate_reply
from app.services.rag_service import rag_service


async def handle_chat(db: AsyncSession, payload: ChatRequest) -> ChatResponse:
    await session_service.ensure_session_exists(db, payload.session_id, payload.browser_id)

    # 1) خزّن رسالة المستخدم
    user_message = Conversation(
        session_id=payload.session_id, role="user", content=payload.message
    )
    db.add(user_message)

    # 2) ابحث في RAG عن أقرب الشرائح
    matches = await rag_service.search(payload.message)
    context_chunks = [m["chunk"] for m in matches]

    # 3) استدعِ Gemini بالسياق المسترجع فقط
    reply_text = await generate_reply(payload.message, context_chunks)

    # 4) خزّن رد المساعد
    assistant_message = Conversation(
        session_id=payload.session_id, role="assistant", content=reply_text
    )
    db.add(assistant_message)

    # 5) حدّث توقيت آخر تعديل للجلسة
    await db.execute(
        update(Session)
        .where(Session.session_id == payload.session_id)
        .values(updated_at=datetime.utcnow())
    )

    await db.commit()

    return ChatResponse(
        session_id=payload.session_id,
        reply=reply_text,
        sources_found=len(matches),
    )
