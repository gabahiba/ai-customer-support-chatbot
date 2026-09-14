from fastapi import APIRouter, HTTPException
from sqlalchemy import desc
from app.core.database import database
from app.models.chat import Conversation, Session
from app.schemas import ChatRequest, ChatResponse
from app.services.gemini_service import get_gemini_response
from app.rag_service import retrieve_context

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    if not request.message or request.message.strip() == "":
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    browser_id = request.browser_id or "unknown-browser"

    check_session = Session.__table__.select().where(
    Session.session_id == request.session_id
    )
    existing_session = await database.fetch_one(check_session)
    if not existing_session:
        title = request.message[:30] + ("..." if len(request.message) > 30 else "")
        insert_session = Session.__table__.insert().values(
            session_id=request.session_id,
            title=title,
            browser_id=browser_id
        )
        await database.execute(insert_session)

    query = Conversation.__table__.insert().values(
        session_id=request.session_id,
        role="user",
        content=request.message
    )
    await database.execute(query)

    select_query = Conversation.__table__.select() \
        .where(Conversation.session_id == request.session_id) \
        .order_by(desc(Conversation.created_at)) \
        .limit(5)
    recent_messages = await database.fetch_all(select_query)

    retrieved_docs = await retrieve_context(request.message)

    system_instruction = """
    أنت مساعد دعم فني متخصص حصرياً في المعلومات الموجودة في المستندات المرفوعة.
    أجب فقط بناءً على المعلومات المسترجعة من المستندات المرفوعة.
    إذا لم تجد الإجابة في المستندات، قل: "عذراً، هذه المعلومة غير متوفرة في المستندات المتاحة."
    لا تستخدم أي معرفة عامة أو خارجية.
    """

    context_text = ""
    if retrieved_docs:
        context_text += "--- معلومات من المستندات ---\n"
        context_text += retrieved_docs
    else:
        context_text += "(لا توجد مستندات مرفوعة ذات صلة.)"

    full_prompt = f"{system_instruction}\n\n{context_text}\n\nسؤال المستخدم: {request.message}\n\nالمساعد:"

    ai_response = await get_gemini_response(full_prompt)

    query_assistant = Conversation.__table__.insert().values(
        session_id=request.session_id,
        role="assistant",
        content=ai_response
    )
    await database.execute(query_assistant)

    return ChatResponse(
        session_id=request.session_id,
        response=ai_response
    )