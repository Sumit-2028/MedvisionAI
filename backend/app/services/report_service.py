import os
import json
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    HRFlowable,
)
from reportlab.pdfbase.pdfmetrics import stringWidth


# ============================================================
# REPORT DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

REPORTS_DIR = os.path.join(
    BASE_DIR,
    "reports"
)

os.makedirs(
    REPORTS_DIR,
    exist_ok=True
)


# ============================================================
# COLOR PALETTE
# ============================================================

PRIMARY = colors.HexColor("#176B87")
PRIMARY_DARK = colors.HexColor("#0D4F66")
PRIMARY_LIGHT = colors.HexColor("#EAF6FA")

ACCENT = colors.HexColor("#38A3A5")

SUCCESS = colors.HexColor("#198754")
SUCCESS_LIGHT = colors.HexColor("#EAF7EF")

WARNING = colors.HexColor("#D97706")
WARNING_LIGHT = colors.HexColor("#FFF4E5")

DANGER = colors.HexColor("#C62828")
DANGER_LIGHT = colors.HexColor("#FDECEC")

TEXT = colors.HexColor("#263238")
MUTED = colors.HexColor("#607D8B")

BORDER = colors.HexColor("#D7E2E7")
LIGHT_BG = colors.HexColor("#F5F9FA")
WHITE = colors.white


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_text(value):
    """
    Convert values to safe strings for ReportLab.
    """
    if value is None:
        return "Not provided"

    return str(value)


def draw_footer(canvas, document):
    """
    Draw professional footer on every page.
    """

    canvas.saveState()

    page_width, page_height = A4

    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)

    canvas.line(
        18 * mm,
        13 * mm,
        page_width - 18 * mm,
        13 * mm
    )

    # Left footer
    canvas.setFont(
        "Helvetica",
        7.5
    )

    canvas.setFillColor(MUTED)

    canvas.drawString(
        18 * mm,
        8 * mm,
        "MedVision AI • AI-Assisted Medical Imaging"
    )

    # Page number
    page_text = f"Page {document.page}"

    canvas.drawRightString(
        page_width - 18 * mm,
        8 * mm,
        page_text
    )

    canvas.restoreState()


def make_info_table(data):
    """
    Create a consistent professional information table.
    """

    table = Table(
        data,
        colWidths=[
            48 * mm,
            117 * mm
        ],
        hAlign="LEFT"
    )

    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                PRIMARY_LIGHT
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (0, -1),
                PRIMARY_DARK
            ),
            (
                "FONTNAME",
                (0, 0),
                (0, -1),
                "Helvetica-Bold"
            ),
            (
                "FONTNAME",
                (1, 0),
                (1, -1),
                "Helvetica"
            ),
            (
                "TEXTCOLOR",
                (1, 0),
                (1, -1),
                TEXT
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                9
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                9
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                9
            ),
        ])
    )

    return table


def section_header(title):
    """
    Create a colored section header aligned with the information tables.
    """

    table = Table(
        [
            [
                Paragraph(
                    title.upper(),
                    ParagraphStyle(
                        f"SectionHeader_{title}",
                        fontName="Helvetica-Bold",
                        fontSize=10,
                        textColor=WHITE,
                        leading=12,
                        alignment=TA_LEFT
                    )
                )
            ]
        ],
        colWidths=[165 * mm],
        hAlign="LEFT"
    )

    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                PRIMARY
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "LEFT"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )

    return table


# ============================================================
# GENERATE MEDICAL REPORT
# ============================================================

def generate_medical_report(
    report_id,
    diagnosis,
    patient,
    user
):

    # ========================================================
    # FILE PATH
    # ========================================================

    filename = f"medical_report_{report_id}.pdf"

    report_path = os.path.join(
        REPORTS_DIR,
        filename
    )

    # ========================================================
    # PDF DOCUMENT
    # ========================================================

    document = SimpleDocTemplate(
        report_path,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm
    )

    # ========================================================
    # STYLES
    # ========================================================

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        alignment=TA_LEFT,
        fontSize=21,
        leading=25,
        textColor=PRIMARY_DARK,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=MUTED,
        spaceAfter=0
    )

    section_space = 10

    normal_style = ParagraphStyle(
        "NormalCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=TEXT
    )

    small_style = ParagraphStyle(
        "Small",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=MUTED
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=TEXT
    )

    # ========================================================
    # STORY
    # ========================================================

    story = []

    # ========================================================
    # BRANDED HEADER
    # ========================================================

    header_left = [
        Paragraph(
            "MEDVISION AI",
            title_style
        ),
        Paragraph(
            "Medical Imaging Intelligence Platform",
            subtitle_style
        )
    ]

    header_right = [
    Paragraph(
        "<b>AI</b>",
        ParagraphStyle(
            "AIBox",
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=2,
        )
    ),
    Paragraph(
        "CHEST X-RAY",
        ParagraphStyle(
            "XrayLabel",
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=9,
            textColor=WHITE,
            alignment=TA_CENTER,
        )
    )
]

    header_table = Table(
        [
            [
                header_left,
                header_right
            ]
        ],
        colWidths=[
            135 * mm,
            30 * mm
        ]
    )

    header_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (1, 0),
                (1, 0),
                PRIMARY
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (0, 0),
                0
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (0, 0),
                10
            ),
            (
                "LEFTPADDING",
                (1, 0),
                (1, 0),
                5
            ),
            (
                "RIGHTPADDING",
                (1, 0),
                (1, 0),
                5
            ),
            (
                "TOPPADDING",
                (1, 0),
                (1, 0),
                8
            ),
            (
                "BOTTOMPADDING",
                (1, 0),
                (1, 0),
                8
            ),
        ])
    )

    story.append(header_table)

    story.append(
        Spacer(1, 8)
    )

    story.append(
        HRFlowable(
            width="100%",
            thickness=1.2,
            color=PRIMARY,
            spaceBefore=0,
            spaceAfter=8
        )
    )

    # ========================================================
    # REPORT TITLE
    # ========================================================

    story.append(
        Paragraph(
            "CHEST X-RAY ANALYSIS REPORT",
            ParagraphStyle(
                "MainReportTitle",
                parent=title_style,
                fontSize=17,
                textColor=TEXT,
                spaceAfter=3
            )
        )
    )

    story.append(
        Paragraph(
            "AI-Assisted Clinical Assessment",
            ParagraphStyle(
                "ClinicalSubtitle",
                parent=subtitle_style,
                fontSize=9.5,
                textColor=PRIMARY
            )
        )
    )

    story.append(
        Spacer(1, 12)
    )

    # ========================================================
    # REPORT INFORMATION
    # ========================================================

    story.append(
        section_header("Report Information")
    )

    story.append(
        Spacer(1, 5)
    )

    report_data = [
        [
            "Report ID",
            safe_text(report_id)
        ],
        [
            "Diagnosis ID",
            safe_text(diagnosis.diagnosis_id)
        ],
        [
            "Date",
            diagnosis.diagnosis_timestamp.strftime(
                "%d %B %Y"
            )
        ],
        [
            "Time",
            diagnosis.diagnosis_timestamp.strftime(
                "%H:%M:%S UTC"
            )
        ]
    ]

    story.append(
        make_info_table(report_data)
    )

    story.append(
        Spacer(1, section_space)
    )

    # ========================================================
    # PATIENT INFORMATION
    # ========================================================

    story.append(
        section_header("Patient Information")
    )

    story.append(
        Spacer(1, 5)
    )

    patient_data = [
        [
            "Patient ID",
            safe_text(patient.patient_id)
        ],
        [
            "Name",
            safe_text(user.full_name)
        ],
        [
            "Age",
            safe_text(patient.age)
        ],
        [
            "Gender",
            safe_text(patient.gender)
        ]
    ]

    story.append(
        make_info_table(patient_data)
    )

    story.append(
        Spacer(1, section_space)
    )

    # ========================================================
    # AI ASSESSMENT
    # ========================================================

    story.append(
        section_header("AI Assessment")
    )

    story.append(
        Spacer(1, 5)
    )

    status_text = diagnosis.result_status

    if status_text == "NORMAL":
        assessment = "NO ABNORMALITY DETECTED"
        status_color = SUCCESS
        status_background = SUCCESS_LIGHT
    else:
        assessment = "POTENTIAL ABNORMALITY DETECTED"
        status_color = WARNING
        status_background = WARNING_LIGHT

    status_box = Table(
        [
            [
                Paragraph(
                    f"<b>{assessment}</b>",
                    ParagraphStyle(
                        "StatusText",
                        fontName="Helvetica-Bold",
                        fontSize=11,
                        textColor=status_color,
                        alignment=TA_CENTER
                    )
                )
            ]
        ],
        colWidths=[165 * mm]
    )

    status_box.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                status_background
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.8,
                status_color
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
        ])
    )

    story.append(status_box)

    story.append(
        Spacer(1, 7)
    )

    assessment_data = [
        [
            Paragraph(
                "<b>Primary Finding</b>",
                normal_style
            ),
            Paragraph(
                safe_text(diagnosis.predicted_disease),
                normal_style
            )
        ],
        [
            Paragraph(
                "<b>Confidence Score</b>",
                normal_style
            ),
            Paragraph(
                f"{diagnosis.confidence_score * 100:.2f}%",
                ParagraphStyle(
                    "Confidence",
                    parent=normal_style,
                    fontName="Helvetica-Bold",
                    textColor=PRIMARY_DARK
                )
            )
        ]
    ]

    assessment_table = Table(
        assessment_data,
        colWidths=[
            48 * mm,
            117 * mm
        ]
    )

    assessment_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                LIGHT_BG
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                9
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                9
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            )
        ])
    )

    story.append(assessment_table)

    story.append(
        Spacer(1, section_space)
    )

    # ========================================================
    # DETECTED FINDINGS
    # ========================================================

    story.append(
        section_header("Detected Findings")
    )

    story.append(
        Spacer(1, 5)
    )

    findings = json.loads(
        diagnosis.findings_json
    )

    if len(findings) == 0:

        normal_box = Table(
            [
                [
                    Paragraph(
                        "No findings exceeded the configured "
                        "prototype detection threshold.",
                        normal_style
                    )
                ]
            ],
            colWidths=[165 * mm]
        )

        normal_box.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    SUCCESS_LIGHT
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.7,
                    SUCCESS
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    10
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    10
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                )
            ])
        )

        story.append(normal_box)

    else:

        findings_data = [
            [
                Paragraph(
                    "<b>Disease</b>",
                    normal_style
                ),
                Paragraph(
                    "<b>Probability</b>",
                    normal_style
                ),
                Paragraph(
                    "<b>Status</b>",
                    normal_style
                )
            ]
        ]

        for finding in findings:

            findings_data.append(
                [
                    Paragraph(
                        safe_text(
                            finding.get("disease")
                        ),
                        normal_style
                    ),
                    Paragraph(
                        f'{finding.get("probability", 0):.2f}%',
                        normal_style
                    ),
                    Paragraph(
                        safe_text(
                            finding.get("status")
                        ).upper(),
                        ParagraphStyle(
                            "FindingStatus",
                            parent=normal_style,
                            fontName="Helvetica-Bold",
                            textColor=DANGER
                        )
                    )
                ]
            )

        findings_table = Table(
            findings_data,
            colWidths=[
                85 * mm,
                40 * mm,
                40 * mm
            ],
            repeatRows=1
        )

        findings_table.setStyle(
            TableStyle([
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    PRIMARY_LIGHT
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    PRIMARY_DARK
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    BORDER
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE"
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8.5
                )
            ])
        )

        story.append(findings_table)

    story.append(
        Spacer(1, section_space)
    )

    # ========================================================
    # X-RAY IMAGE
    # ========================================================

    story.append(
        section_header("Chest X-Ray")
    )

    story.append(
        Spacer(1, 7)
    )

    image_path = diagnosis.image_path

    if os.path.exists(image_path):

        try:

            xray = Image(
                image_path,
                width=105 * mm,
                height=105 * mm
            )

            image_table = Table(
                [
                    [xray]
                ],
                colWidths=[165 * mm]
            )

            image_table.setStyle(
                TableStyle([
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.8,
                        BORDER
                    ),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.black
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER"
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE"
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        8
                    )
                ])
            )

            story.append(image_table)

        except Exception:

            story.append(
                Paragraph(
                    "X-ray image could not be embedded.",
                    normal_style
                )
            )

    else:

        story.append(
            Paragraph(
                "X-ray image file was not found.",
                normal_style
            )
        )

    story.append(
        Spacer(1, section_space)
    )

    # ========================================================
    # AI MODEL INFORMATION
    # ========================================================

    story.append(
        section_header("AI Model Information")
    )

    story.append(
        Spacer(1, 5)
    )

    model_data = [
        [
            "Model",
            "DenseNet121"
        ],
        [
            "Task",
            "Multi-label chest X-ray abnormality classification"
        ],
        [
            "Analyzed Conditions",
            "14"
        ],
        [
            "Assessment Type",
            "AI-assisted / prototype"
        ]
    ]

    story.append(
        make_info_table(model_data)
    )

    story.append(
        Spacer(1, section_space)
    )

    # ========================================================
    # DISCLAIMER
    # ========================================================

    disclaimer_title = Paragraph(
        "IMPORTANT DISCLAIMER",
        ParagraphStyle(
            "DisclaimerTitle",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=DANGER,
            leading=12
        )
    )

    disclaimer_text = Paragraph(
        "This report contains an AI-generated assessment "
        "intended for research and clinical decision-support "
        "purposes. It is not a definitive medical diagnosis. "
        "The results should be reviewed and interpreted by "
        "a qualified healthcare professional before any "
        "clinical decision is made.",
        disclaimer_style
    )

    disclaimer_table = Table(
        [
            [disclaimer_title],
            [disclaimer_text]
        ],
        colWidths=[165 * mm]
    )

    disclaimer_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                DANGER_LIGHT
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.8,
                DANGER
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            )
        ])
    )

    story.append(
        disclaimer_table
    )

    story.append(
        Spacer(1, 10)
    )

    # ========================================================
    # FINAL BRANDING
    # ========================================================

    story.append(
        Paragraph(
            "MEDVISION AI",
            ParagraphStyle(
                "FinalBrand",
                fontName="Helvetica-Bold",
                fontSize=9,
                alignment=TA_CENTER,
                textColor=PRIMARY
            )
        )
    )

    story.append(
        Paragraph(
            "AI-Assisted Medical Imaging • Research Prototype",
            ParagraphStyle(
                "FinalBrandSub",
                fontName="Helvetica",
                fontSize=7.5,
                alignment=TA_CENTER,
                textColor=MUTED
            )
        )
    )

    # ========================================================
    # BUILD PDF
    # ========================================================

    document.build(
        story,
        onFirstPage=draw_footer,
        onLaterPages=draw_footer
    )

    return report_path