import asyncio
import io

from pypdf import PdfReader


def _extract_text_sync(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages_text = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages_text.append(text)
    return "\n".join(pages_text)


async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """يستخرج النص من ملف PDF بشكل غير متزامن (عملية ثقيلة تُنفَّذ في thread منفصل)."""
    return await asyncio.to_thread(_extract_text_sync, file_bytes)
