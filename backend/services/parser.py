import fitz  # PyMuPDF — used only for image extraction
import base64
import tempfile
import os
from typing import Any

from docling.document_converter import DocumentConverter
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat
from docling.document_converter import PdfFormatOption
from docling_core.types.doc import DocItemLabel

# Initialise converter once (models are cached after first download)
_converter = None

def get_converter():
    global _converter
    if _converter is None:
        print("[parser] Initialising Docling converter (may download models on first run)...")
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False          # digital PDFs only
        pipeline_options.do_table_structure = True
        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        print("[parser] Docling ready.")
    return _converter


LABEL_TO_BLOCK_TYPE = {
    DocItemLabel.TITLE:          "heading",
    DocItemLabel.SECTION_HEADER: "subheading",
    DocItemLabel.TEXT:           "paragraph",
    DocItemLabel.PARAGRAPH:      "paragraph",
    DocItemLabel.LIST_ITEM:      "list_item",
    DocItemLabel.CAPTION:        "caption",
    DocItemLabel.PAGE_FOOTER:    "footer",
    DocItemLabel.PAGE_HEADER:    "footer",
    DocItemLabel.FOOTNOTE:       "footer",
    DocItemLabel.TABLE:          "table",
    DocItemLabel.PICTURE:        "image",
}


def extract_images_by_page(pdf_bytes: bytes) -> dict[int, list[dict]]:
    """Extract images per page by rendering each image's bounding box region."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images_by_page: dict[int, list[dict]] = {}

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_images = []
        for img in page.get_images(full=True):
            img_bbox = page.get_image_bbox(img)
            if img_bbox.is_empty:
                continue
            try:
                # Render the exact page region — preserves all vector overlays and
                # avoids the black-background issue caused by alpha-channel compositing.
                clip = fitz.Rect(img_bbox)
                mat = fitz.Matrix(2, 2)  # 2× for sharpness
                pix = page.get_pixmap(matrix=mat, clip=clip, colorspace=fitz.csRGB, alpha=False)
                img_bytes = pix.tobytes("png")
                img_data = base64.b64encode(img_bytes).decode()
                page_images.append({
                    "type": "image",
                    "block_type": "image",
                    "bbox": [round(v, 2) for v in img_bbox],
                    "src": f"data:image/png;base64,{img_data}",
                    "column": 0,
                })
            except Exception as e:
                xref = img[0]
                print(f"[parser] image xref={xref} skipped: {e}")
        images_by_page[page_idx + 1] = page_images

    doc.close()
    return images_by_page


def bbox_to_list(bbox) -> list[float]:
    """Convert Docling BoundingBox to [x0, y0, x1, y1]."""
    return [round(bbox.l, 2), round(bbox.t, 2), round(bbox.r, 2), round(bbox.b, 2)]


def detect_columns(elements: list[dict], page_width: float) -> str:
    text_els = [e for e in elements if e.get("type") == "text_block"]
    if len(text_els) < 3:
        return "single"
    mid = page_width / 2
    x_centers = [(e["bbox"][0] + e["bbox"][2]) / 2 for e in text_els]
    left  = sum(1 for x in x_centers if x < mid * 0.75)
    right = sum(1 for x in x_centers if x > mid * 1.25)
    total = len(x_centers)
    if left / total > 0.25 and right / total > 0.25:
        return "two-column"
    return "single"


def assign_columns(elements: list[dict], page_width: float, layout: str) -> list[dict]:
    mid = page_width / 2
    for el in elements:
        if layout == "single":
            el["column"] = 0
        else:
            x_center = (el["bbox"][0] + el["bbox"][2]) / 2
            el["column"] = 0 if x_center <= mid else 1
    return elements


def parse_pdf(pdf_bytes: bytes) -> dict[str, Any]:
    images_by_page = extract_images_by_page(pdf_bytes)

    # Write to temp file for Docling
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        tmp_path = f.name

    try:
        result = get_converter().convert(tmp_path)
    finally:
        os.unlink(tmp_path)

    doc = result.document
    pages_map: dict[int, dict] = {}

    # Collect page sizes
    for page_no, page in doc.pages.items():
        pages_map[page_no] = {
            "page_number": page_no,
            "width": round(page.size.width, 2) if page.size else 612,
            "height": round(page.size.height, 2) if page.size else 792,
            "elements": [],
        }

    # Iterate all document items
    for item, _ in doc.iterate_items():
        label = getattr(item, "label", None)
        if label is None:
            continue

        # Get provenance (page + bbox)
        prov = item.prov[0] if item.prov else None
        if not prov:
            continue

        page_no = prov.page_no
        if page_no not in pages_map:
            continue

        page_width  = pages_map[page_no]["width"]
        page_height = pages_map[page_no]["height"]
        bbox = bbox_to_list(prov.bbox.to_top_left_origin(page_height))
        block_type = LABEL_TO_BLOCK_TYPE.get(label, "other")

        if label == DocItemLabel.TABLE:
            try:
                rows = [[cell.text for cell in row] for row in item.data.grid]
            except Exception:
                rows = []
            pages_map[page_no]["elements"].append({
                "type": "table",
                "block_type": "table",
                "bbox": bbox,
                "column": 0,
                "rows": rows,
            })

        elif label == DocItemLabel.PICTURE:
            # Images are handled by PyMuPDF below
            pass

        else:
            text = item.text if hasattr(item, "text") else ""
            if not text.strip():
                continue
            pages_map[page_no]["elements"].append({
                "type": "text_block",
                "block_type": block_type,
                "gemini_text": text.strip(),
                "bbox": bbox,
                "column": 0,
                # Minimal lines structure for fallback rendering
                "lines": [{"spans": [{
                    "text": text.strip(),
                    "font": "",
                    "size": 16 if block_type == "heading" else 13 if block_type == "subheading" else 11,
                    "bold": block_type in ("heading", "subheading"),
                    "italic": False,
                    "color": "#000000",
                    "bbox": bbox,
                }]}],
            })

    # Merge images from PyMuPDF and finalise pages
    pages = []
    for page_no in sorted(pages_map.keys()):
        p = pages_map[page_no]
        elements = p["elements"] + images_by_page.get(page_no, [])
        elements.sort(key=lambda e: (round(e["bbox"][1] / 10), e["bbox"][0]))

        layout = detect_columns(elements, p["width"])
        elements = assign_columns(elements, p["width"], layout)

        pages.append({
            "page_number": p["page_number"],
            "width": p["width"],
            "height": p["height"],
            "layout": layout,
            "elements": elements,
        })

    return {"page_count": len(pages), "pages": pages}
