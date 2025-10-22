import os
from typing import Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_pdf(results: Dict, output_path: str) -> None:
    """Generate a PDF report with the findings and score."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    content = []

    content.append(Paragraph("CloudSec Scanner Report", styles["Title"]))
    content.append(Paragraph(f"Security Score: {results['score']}/100", styles["Heading2"]))
    content.append(Spacer(1, 12))

    data = [["Category", "Description", "Severity"]]
    for finding in results.get("findings", []):
        data.append(
            [
                finding.get("category", "-"),
                finding.get("description", "-"),
                finding.get("severity", "-"),
            ]
        )

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )

    content.append(table)
    doc.build(content)
