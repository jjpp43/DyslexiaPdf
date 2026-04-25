import os
import json
from google import genai
from google.genai import types

_client = None

def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client

SENTENCE_SPLIT_PROMPT = """You are a sentence splitter for PDF text. Split each block into individual sentences.

Rules:
- Split on sentence-ending punctuation (. ! ?) followed by a capital letter or quote
- Keep abbreviations intact: Dr., Mr., Fig., e.g., i.e., U.S., etc.
- Keep decimal numbers intact: 3.14, 2.5
- Do NOT modify the text — only split it
- If a block is already a single sentence, return it as a one-element array

Return ONLY a JSON array, no explanation:
[
  { "index": 0, "sentences": ["First sentence.", "Second sentence."] },
  ...
]"""

SYSTEM_PROMPT = """You are a document structure analyzer. Given text blocks extracted from a PDF page, do two things for each block:

1. Classify it into one of: "heading", "subheading", "paragraph", "list_item", "caption", "footer", "other"
2. Reconstruct the text by fixing PDF extraction artifacts:
   - Merge lines that are part of the same sentence (remove artificial line breaks)
   - Fix hyphenated line endings (e.g. "collabora-\\ntion" → "collaboration")
   - Preserve intentional breaks (e.g. separate list items stay separate)
   - Do NOT add or remove any actual words — only fix line break artifacts

Classification rules:
- "heading": main section title, large/bold, short (1-8 words)
- "subheading": subsection title, smaller than heading, short
- "paragraph": regular body text, multiple sentences flowing together
- "list_item": numbered (1. 2. 3.) or bulleted entry
- "caption": short label near a figure or table
- "footer": page numbers, footnotes, disclaimers
- "other": anything else

Return ONLY a JSON array, no explanation:
[
  { "index": 0, "block_type": "heading", "text": "Clean reconstructed text" },
  ...
]"""


def raw_text(block: dict) -> str:
    return " ".join(
        span["text"]
        for line in block.get("lines", [])
        for span in line.get("spans", [])
    ).strip()


def heuristic_classify(block: dict) -> dict:
    """Fallback: classify and return lightly merged text."""
    if block.get("type") != "text_block":
        return {"block_type": block.get("type", "other"), "text": None}
    lines = block.get("lines", [])
    spans = [s for l in lines for s in l.get("spans", [])]
    if not spans:
        return {"block_type": "other", "text": None}

    avg_size = sum(s.get("size", 12) for s in spans) / len(spans)
    all_bold = all(s.get("bold", False) for s in spans)
    text = raw_text(block)
    word_count = len(text.split())

    if avg_size >= 14 and word_count <= 12:
        block_type = "heading"
    elif all_bold and word_count <= 15:
        block_type = "subheading"
    elif text and text[0].isdigit() and len(text) > 1 and text[1] in ".):":
        block_type = "list_item"
    else:
        block_type = "paragraph"

    return {"block_type": block_type, "text": text}


def _regex_split_sentences(text: str) -> list[str]:
    import re
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z"\'])', text)
    return [s.strip() for s in parts if s.strip()]


def split_sentences(blocks: list[dict]) -> list[dict]:
    """
    Split text blocks into sentences using Gemini.
    Falls back to regex on any error.
    blocks: [{ "index": int, "text": str }]
    returns: [{ "index": int, "sentences": [str] }]
    """
    if not blocks:
        return []

    def regex_fallback():
        return [{"index": b["index"], "sentences": _regex_split_sentences(b["text"])} for b in blocks]

    try:
        prompt = f"Split these text blocks into sentences:\n{json.dumps(blocks, ensure_ascii=False)}"
        response = get_client().models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(system_instruction=SENTENCE_SPLIT_PROMPT),
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        results = json.loads(raw)
        # Ensure every input block has a result
        covered = {r["index"] for r in results}
        for b in blocks:
            if b["index"] not in covered:
                results.append({"index": b["index"], "sentences": _regex_split_sentences(b["text"])})
        return results
    except Exception as e:
        print(f"[llm] Sentence split failed, using regex: {e}")
        return regex_fallback()


def classify_blocks(blocks: list[dict]) -> list[dict]:
    """
    Classify blocks and reconstruct text using Gemini.
    Returns list of {"block_type": str, "text": str | None} dicts.
    Falls back to heuristics on any error.
    """
    if not blocks:
        return []

    simplified = [
        {
            "index": i,
            "text": raw_text(block),
            "is_bold": any(
                span.get("bold", False)
                for line in block.get("lines", [])
                for span in line.get("spans", [])
            ),
            "font_size": max(
                (span.get("size", 12)
                 for line in block.get("lines", [])
                 for span in line.get("spans", [])),
                default=12,
            ),
        }
        for i, block in enumerate(blocks)
        if block.get("type") == "text_block"
    ]

    if not simplified:
        return [heuristic_classify(b) for b in blocks]

    try:
        prompt = f"Process these text blocks from a PDF page:\n{json.dumps(simplified, ensure_ascii=False)}"
        response = get_client().models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        classifications = json.loads(raw)
        index_to_result = {
            item["index"]: {"block_type": item["block_type"], "text": item.get("text")}
            for item in classifications
        }

        result = []
        text_idx = 0
        for block in blocks:
            if block.get("type") == "text_block":
                result.append(index_to_result.get(text_idx, {"block_type": "paragraph", "text": None}))
                text_idx += 1
            else:
                result.append({"block_type": block.get("type", "other"), "text": None})
        return result

    except Exception as e:
        print(f"[llm] Gemini classify failed, using heuristics: {e}")
        return [heuristic_classify(b) for b in blocks]
