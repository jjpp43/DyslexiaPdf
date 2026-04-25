from fastapi import APIRouter
from pydantic import BaseModel
from services.llm import split_sentences

router = APIRouter(prefix="/sentences", tags=["sentences"])


class Block(BaseModel):
    index: int
    text: str


class SplitRequest(BaseModel):
    blocks: list[Block]


@router.post("/split")
async def split(req: SplitRequest):
    blocks = [{"index": b.index, "text": b.text} for b in req.blocks]
    results = split_sentences(blocks)
    return {"results": results}
