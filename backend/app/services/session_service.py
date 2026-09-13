import uuid

from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Session, Conversation
from app.schemas.chat import SessionCreate, SessionUpdate


async def list_sessions(db: AsyncSession, browser_id: str) -> list[Session]:
    result = await db.execute(
        select(Session).where(Session.browser_id == browser_id).order_by(Session.updated_at.desc())
    )
    return list(result.scalars().all())


async def create_session(db: AsyncSession, payload: SessionCreate) -> Session:
    new_session = Session(
        session_id=str(uuid.uuid4()),
        title=payload.title or "محادثة جديدة",
        browser_id=payload.browser_id,
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session


async def update_session_title(db: AsyncSession, session_id: str, payload: SessionUpdate) -> Session:
    result = await db.execute(select(Session).where(Session.session_id == session_id))
    session_obj = result.scalar_one_or_none()
    if session_obj is None:
        raise HTTPException(status_code=404, detail="الجلسة غير موجودة")

    session_obj.title = payload.title
    await db.commit()
    await db.refresh(session_obj)
    return session_obj


async def delete_session(db: AsyncSession, session_id: str) -> None:
    result = await db.execute(select(Session).where(Session.session_id == session_id))
    session_obj = result.scalar_one_or_none()
    if session_obj is None:
        raise HTTPException(status_code=404, detail="الجلسة غير موجودة")

    await db.execute(delete(Conversation).where(Conversation.session_id == session_id))
    await db.execute(delete(Session).where(Session.session_id == session_id))
    await db.commit()


async def get_messages(db: AsyncSession, session_id: str) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.asc())
    )
    return list(result.scalars().all())


async def ensure_session_exists(db: AsyncSession, session_id: str, browser_id: str) -> Session:
    result = await db.execute(select(Session).where(Session.session_id == session_id))
    session_obj = result.scalar_one_or_none()
    if session_obj is None:
        session_obj = Session(session_id=session_id, browser_id=browser_id, title="محادثة جديدة")
        db.add(session_obj)
        await db.commit()
        await db.refresh(session_obj)
    return session_obj
