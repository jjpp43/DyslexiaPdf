from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from services.parser import parse_pdf
import fitz
import os

router = APIRouter(prefix="/parse", tags=["parse"])

def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


class ParseRequest(BaseModel):
    pdf_id: str
    storage_path: str


MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MAX_FREE_PAGES = 100


@router.post("")
async def parse(req: ParseRequest):
    supabase = get_supabase()

    # Mark as processing
    supabase.table("pdfs").update({"status": "processing"}).eq("id", req.pdf_id).execute()

    try:
        # Download PDF from Supabase Storage
        response = supabase.storage.from_("pdfs").download(req.storage_path)
        pdf_bytes = response

        if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
            supabase.table("pdfs").update({
                "status": "error",
                "error_message": "File exceeds 25 MB limit for free plan.",
            }).eq("id", req.pdf_id).execute()
            raise HTTPException(status_code=413, detail="File exceeds 25 MB limit for free plan.")

        # Check page count
        _doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(_doc)
        _doc.close()

        if page_count > MAX_FREE_PAGES:
            supabase.table("pdfs").update({
                "status": "error",
                "error_message": f"Document has {page_count} pages. Free plan limit is {MAX_FREE_PAGES} pages.",
            }).eq("id", req.pdf_id).execute()
            raise HTTPException(
                status_code=413,
                detail=f"Document has {page_count} pages. Free plan limit is {MAX_FREE_PAGES} pages.",
            )

        # Parse
        result = parse_pdf(pdf_bytes)

        # Save each page to pdf_pages table
        pages_to_insert = [
            {
                "pdf_id": req.pdf_id,
                "page_number": page["page_number"],
                "page_data": page,
            }
            for page in result["pages"]
        ]

        # Insert in batches of 10
        batch_size = 10
        for i in range(0, len(pages_to_insert), batch_size):
            supabase.table("pdf_pages").insert(pages_to_insert[i:i + batch_size]).execute()

        # Mark as done
        supabase.table("pdfs").update({
            "status": "done",
            "page_count": result["page_count"],
        }).eq("id", req.pdf_id).execute()

        return {"status": "done", "page_count": result["page_count"]}

    except Exception as e:
        supabase.table("pdfs").update({
            "status": "error",
            "error_message": str(e),
        }).eq("id", req.pdf_id).execute()
        raise HTTPException(status_code=500, detail=str(e))
