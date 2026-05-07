from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

import fitz


def extract_pdf_pages(pdf_bytes: bytes) -> list[dict[str, Any]]:
    with TemporaryDirectory() as temp_dir:
        pdf_path = Path(temp_dir) / "lecture.pdf"
        pdf_path.write_bytes(pdf_bytes)

        document = fitz.open(pdf_path)
        pages: list[dict[str, Any]] = []

        for page_index, page in enumerate(document):
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            image_name = f"page-{page_index + 1}.png"
            image_path = Path(temp_dir) / image_name
            pixmap.save(image_path)

            pages.append(
                {
                    "page_number": page_index + 1,
                    "text": page.get_text("text").strip(),
                    "image_bytes": image_path.read_bytes(),
                    "image_name": image_name,
                }
            )

        document.close()
        return pages

