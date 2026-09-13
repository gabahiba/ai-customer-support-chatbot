from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import database, engine, Base
from app.routers import chat, upload, sessions
from app.models.chat import Conversation, Session
import os
from pathlib import Path

app = FastAPI(
    title="AI Customer Support Chatbot API",
    description="Full-stack chatbot with RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(upload.router)
app.include_router(sessions.router)

@app.on_event("startup")
async def startup():
    db_file = Path("chatbot.db")
    if db_file.exists():
        os.remove(db_file)
        print("🗑️ Old database deleted.")
    await database.connect()
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized.")

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
def read_root():
    return {"message": "AI Chatbot API is running!"}

@app.get("/health")
def health_check():
    return {"status": "OK"}