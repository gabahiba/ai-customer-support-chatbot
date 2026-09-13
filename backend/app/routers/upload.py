from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
import tempfile
import traceback
from app.rag_service import index_pdf

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            temp_path = tmp_file.name
        
        print(f"📂 Received file: {file.filename}")
        num_chunks = await index_pdf(temp_path)
        os.unlink(temp_path)
        
        return {
            "status": "success",
            "message": f"File '{file.filename}' uploaded successfully.",
            "chunks_stored": num_chunks
        }
    except Exception as e:
        print(f"❌ UPLOAD ERROR: {type(e).__name__}: {e}")
        traceback.print_exc()
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")