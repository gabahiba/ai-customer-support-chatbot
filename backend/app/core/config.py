import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """إعدادات التطبيق العامة، تُقرأ من متغيرات البيئة."""

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    CHAT_DB_PATH: str = os.getenv("CHAT_DB_PATH", "chatbot.db")
    RAG_DB_PATH: str = os.getenv("RAG_DB_PATH", "rag_data.db")

    CHAT_DATABASE_URL: str = f"sqlite+aiosqlite:///./{CHAT_DB_PATH}"

    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    TOP_K_RESULTS: int = 3

    SYSTEM_INSTRUCTION: str = """
أنت مساعد دعم فني متخصص حصرياً في المعلومات الموجودة في المستندات المرفوعة.
يجب أن ترد دائماً بنفس اللغة التي كتب بها المستخدم سؤاله.

تعليمات صارمة:
1. أجب فقط بناءً على المعلومات المسترجعة من المستندات المرفوعة.
2. إذا لم تجد الإجابة في المستندات، قل: "عذراً، لا أملك هذه المعلومة في المستندات المتاحة."
3. لا تستخدم معرفتك العامة أبداً.
4. لا تخترع أو تفترض أي معلومة غير موجودة في المستندات.
5. كن دقيقاً ومباشراً في ردودك.
"""


settings = Settings()
