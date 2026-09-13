import os
import uuid
import json
import sqlite3
import asyncio
import numpy as np
from typing import List
import pypdf
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found")

genai.configure(api_key=API_KEY)

# ✅ نماذج embeddings المدعومة حالياً
EMBEDDING_MODELS = [
    "models/gemini-embedding-001",  # النموذج المخصص للنصوص
    "models/gemini-embedding-2",    # النموذج متعدد الوسائط
]
DB_PATH = "./rag_data.db"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            chunk TEXT NOT NULL,
            embedding BLOB NOT NULL,
            metadata TEXT
        )
    """)
    conn.commit()
    conn.close()


init_db()


def get_embedding(text: str) -> List[float]:
    """محاولة استخدام عدة نماذج embeddings حتى ينجح أحدها"""
    last_error = None
    for model_name in EMBEDDING_MODELS:
        try:
            print(f"🔍 Trying embedding model: {model_name}")
            result = genai.embed_content(
                model=model_name,
                content=text,
                task_type="retrieval_document"
            )
            print(f"✅ Success with: {model_name}")
            return result["embedding"]
        except Exception as e:
            print(f"❌ Failed with {model_name}: {e}")
            last_error = e
    raise Exception(f"All embedding models failed. Last error: {last_error}")


def extract_text_from_pdf(file_path: str) -> str:
    reader = pypdf.PdfReader(file_path)
    full_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text += text + "\n"
    return full_text


def split_text_into_chunks(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    chunks = []
    start = 0
    text_length = len(text)
    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk = text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks


async def index_pdf(file_path: str) -> int:
    print(f"📄 Starting to index: {file_path}")
    
    text = await asyncio.to_thread(extract_text_from_pdf, file_path)
    print(f"📝 Extracted text length: {len(text)}")
    
    if not text.strip():
        raise ValueError("الملف فارغ أو لا يحتوي على نص.")

    chunks = split_text_into_chunks(text)
    print(f"✂️ Created {len(chunks)} chunks")
    
    if not chunks:
        raise ValueError("لم يتم استخراج أي نص.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents")
    conn.commit()

    def process_chunks():
        embeddings = []
        for i, chunk in enumerate(chunks):
            print(f"🔄 Embedding chunk {i+1}/{len(chunks)}...")
            emb = get_embedding(chunk)
            embeddings.append(emb)
        return embeddings

    all_embeddings = await asyncio.to_thread(process_chunks)
    print(f"✅ Generated {len(all_embeddings)} embeddings")

    for i, chunk in enumerate(chunks):
        chunk_id = str(uuid.uuid4())
        embedding_blob = np.array(all_embeddings[i], dtype=np.float32).tobytes()
        cursor.execute(
            "INSERT INTO documents (id, chunk, embedding, metadata) VALUES (?, ?, ?, ?)",
            (chunk_id, chunk, embedding_blob, json.dumps({"source": file_path}))
        )
    
    conn.commit()
    conn.close()
    print(f"💾 Saved to database")
    return len(chunks)


async def retrieve_context(query: str, top_k: int = 3) -> str:
    query_embedding = await asyncio.to_thread(get_embedding, query)
    query_np = np.array(query_embedding, dtype=np.float32)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, chunk, embedding FROM documents")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return ""

    similarities = []
    for row in rows:
        stored_emb = np.frombuffer(row[2], dtype=np.float32)
        norm_a = np.linalg.norm(query_np)
        norm_b = np.linalg.norm(stored_emb)
        if norm_a == 0 or norm_b == 0:
            sim = 0.0
        else:
            sim = np.dot(query_np, stored_emb) / (norm_a * norm_b)
        similarities.append((sim, row[1]))

    similarities.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [text for _, text in similarities[:top_k]]
    return "\n---\n".join(top_chunks)