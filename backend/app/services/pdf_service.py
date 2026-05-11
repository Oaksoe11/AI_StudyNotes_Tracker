from collections.abc import Callable
from typing import Any

import fitz


def extract_pdf_pages(
    pdf_bytes: bytes,
    max_pages: int = 20,
    image_scale: float = 0.9,
    progress_callback: Callable[[int, int], None] | None = None,
) -> list[dict[str, Any]]:
    document = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: list[dict[str, Any]] = []

    try:
        page_limit = min(document.page_count, max_pages)
        matrix = fitz.Matrix(image_scale, image_scale)

        for page_index in range(page_limit):
            # Tell the caller which slide is currently being extracted.
            # The backend uses this to show progress like "Extracting slide 3 of 20".
            if progress_callback:
                progress_callback(page_index + 1, page_limit)

            page = document.load_page(page_index)
            text = page.get_text("text").strip()
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            image_name = f"page-{page_index + 1}.png"

            pages.append(
                {
                    "page_number": page_index + 1,
                    "text": text,
                    "image_bytes": pixmap.tobytes("png"),
                    "image_name": image_name,
                }
            )

            pixmap = None
    finally:
        document.close()

    return pages
