"""Build the fictional, clearly marked PDFs for the document signing portfolio demo.

The pages repeat the contract shown in src/components/legalhub/Paper.tsx:
source.pdf — the document as uploaded, signing.pdf — signature and round seal
on page 2, certification.pdf — the «Копия верна» stamp on every page.

Requires reportlab. Uses PT Serif and Arial from macOS system fonts.
This does not call or reproduce the production processor.
"""
import math
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/demos/legalhub"
OUT.mkdir(parents=True, exist_ok=True)
FONTS = Path("/System/Library/Fonts/Supplemental")
pdfmetrics.registerFont(TTFont("Serif", str(FONTS / "PTSerif.ttc"), subfontIndex=0))
pdfmetrics.registerFont(TTFont("SerifBold", str(FONTS / "PTSerif.ttc"), subfontIndex=3))
pdfmetrics.registerFont(TTFont("Sans", str(FONTS / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("SansBold", str(FONTS / "Arial Bold.ttf")))

W, H = A4
LEFT, RIGHT = 62, W - 62
TEXT = colors.HexColor("#27231e")
MUTED = colors.HexColor("#8b8274")
LINE = colors.HexColor("#e2dacc")
SEAL = colors.HexColor("#3446b0")
PEN = colors.HexColor("#1d2f8f")

BODY = ParagraphStyle(
    "body", fontName="Serif", fontSize=11, leading=16.5, textColor=TEXT, alignment=TA_JUSTIFY
)
TITLE = ParagraphStyle(
    "title", fontName="SerifBold", fontSize=17, leading=22, textColor=TEXT, alignment=TA_CENTER
)

SIGNATURE = [
    "M6 42c10-3 16-24 24-26 6-2-4 30 3 31 7 1 13-27 20-27 5 0 1 22 7 22 8 0 10-17 17-17"
    " 6 0 3 14 9 14 9 0 14-12 24-14 11-2 18 2 44-6",
    "M22 50c30-6 70-8 118-12",
]


def para(c, y, html, style=BODY, x=LEFT, width=RIGHT - LEFT, after=6):
    p = Paragraph(html, style)
    _, height = p.wrap(width, 500)
    p.drawOn(c, x, y - height)
    return y - height - after


def heading(c, y, value):
    c.setFont("SerifBold", 11.5)
    c.setFillColor(TEXT)
    c.drawString(LEFT, y - 11, value)
    return y - 22


def chrome(c, page):
    c.setFont("Sans", 8)
    c.setFillColor(MUTED)
    c.drawString(LEFT, H - 50, "Студия «Пример»")
    c.drawRightString(RIGHT, H - 50, "Образец · не является документом")
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(LEFT, H - 58, RIGHT, H - 58)
    c.drawString(LEFT, 40, "DEMO-001")
    c.drawRightString(RIGHT, 40, f"{page} / 2")


def page_one(c):
    y = para(c, H - 92, "Договор оказания услуг<br/>№ DEMO-001", TITLE, after=16)
    c.setFont("Serif", 11)
    c.setFillColor(TEXT)
    c.drawString(LEFT, y - 10, "г. Демоград")
    c.drawRightString(RIGHT, y - 10, "17 ноября 2026 г.")
    y -= 34
    y = para(
        c,
        y,
        "Компания «Демо», именуемая в дальнейшем «Заказчик», и Студия «Пример», именуемая "
        "в дальнейшем «Исполнитель», заключили настоящий договор о нижеследующем.",
        after=14,
    )
    y = heading(c, y, "1. Предмет договора")
    y = para(
        c,
        y,
        "1.1. Исполнитель обязуется разработать демонстрационный интерфейс, а Заказчик — "
        "принять и оплатить результат на условиях договора.",
    )
    y = para(c, y, "1.2. Требования к результату согласуются сторонами в техническом задании.", after=14)
    y = heading(c, y, "2. Порядок выполнения")
    y = para(
        c,
        y,
        "2.1. Исполнитель передаёт результат в электронном виде не позднее срока, указанного "
        "в задании.",
    )
    y = para(
        c,
        y,
        "2.2. Заказчик в течение пяти рабочих дней проверяет результат и подписывает акт либо "
        "направляет замечания.",
        after=14,
    )
    y = heading(c, y, "3. Стоимость и оплата")
    para(c, y, "3.1. Стоимость работ указана в приложении № 1 и не меняется без согласия сторон.")


def page_two(c):
    """Draws page 2 and returns the point under the contractor's signature line."""
    y = heading(c, H - 92, "4. Заключительные положения")
    y = para(
        c,
        y,
        "4.1. Договор вступает в силу с даты подписания и действует до полного исполнения "
        "обязательств.",
    )
    y = para(c, y, "4.2. Договор составлен в двух экземплярах, по одному для каждой стороны.", after=14)
    y = heading(c, y, "5. Реквизиты и подписи сторон")
    col = LEFT + (RIGHT - LEFT) / 2 + 14
    rows = [
        ("Заказчик", "Исполнитель"),
        ("Компания «Демо»", "Студия «Пример»"),
        ("ИНН 0000000000", "ИНН 1111111111"),
        ("р/с 00000 00000 0000000", "р/с 11111 11111 1111111"),
    ]
    for i, (left, right) in enumerate(rows):
        c.setFont("SerifBold" if i == 0 else "Serif", 11)
        c.setFillColor(TEXT)
        c.drawString(LEFT, y - 12, left)
        c.drawString(col, y - 12, right)
        y -= 17
    y -= 46
    c.setFont("Serif", 11)
    c.drawString(LEFT, y, "Генеральный директор")
    c.drawString(col, y, "Директор студии")
    y -= 34
    c.drawString(LEFT, y, "_____________ / Демо А. А. /")
    c.drawString(col, y, "_____________ / Пример Б. Б. /")
    return col, y


def svg_path(c, d, x, y, scale):
    """Draw an SVG path made of M and relative c commands, y axis flipped."""
    p = c.beginPath()
    tokens = re.findall(r"[Mc]|-?\d*\.?\d+", d)
    i, cx, cy, cmd = 0, 0.0, 0.0, None
    while i < len(tokens):
        if tokens[i] in ("M", "c"):
            cmd = tokens[i]
            i += 1
            continue
        if cmd == "M":
            cx, cy = float(tokens[i]), float(tokens[i + 1])
            p.moveTo(x + cx * scale, y - cy * scale)
            i += 2
        else:
            n = [float(t) for t in tokens[i : i + 6]]
            p.curveTo(
                x + (cx + n[0]) * scale,
                y - (cy + n[1]) * scale,
                x + (cx + n[2]) * scale,
                y - (cy + n[3]) * scale,
                x + (cx + n[4]) * scale,
                y - (cy + n[5]) * scale,
            )
            cx, cy = cx + n[4], cy + n[5]
            i += 6
    c.drawPath(p, stroke=1, fill=0)


def signature(c, x, y, width):
    scale = width / 160
    c.saveState()
    c.setStrokeColor(PEN)
    c.setLineCap(1)
    c.setLineJoin(1)
    c.setLineWidth(2.3 * scale)
    svg_path(c, SIGNATURE[0], x, y, scale)
    c.setLineWidth(1.4 * scale)
    svg_path(c, SIGNATURE[1], x, y, scale)
    c.restoreState()


def circle_text(c, text, cx, cy, radius, size):
    c.setFont("SansBold", size)
    widths = [pdfmetrics.stringWidth(ch, "SansBold", size) for ch in text]
    spacing = (2 * math.pi * radius - sum(widths)) / len(text)
    angle = math.pi / 2
    for ch, w in zip(text, widths):
        step = (w + spacing) / radius
        mid = angle - step / 2
        c.saveState()
        c.translate(cx + radius * math.cos(mid), cy + radius * math.sin(mid))
        c.rotate(math.degrees(mid) - 90)
        c.drawCentredString(0, 0, ch)
        c.restoreState()
        angle -= step


def seal(c, cx, cy, d):

    k = d / 120
    c.saveState()
    c.setStrokeColor(SEAL)
    c.setFillColor(SEAL)
    c.setStrokeAlpha(0.82)
    c.setFillAlpha(0.82)
    c.translate(cx, cy)
    c.rotate(11)
    c.setLineWidth(2.8 * k)
    c.circle(0, 0, 57 * k)
    c.setLineWidth(0.9 * k)
    c.circle(0, 0, 53 * k)
    c.setLineWidth(1.3 * k)
    c.circle(0, 0, 34 * k)
    circle_text(c, "СТУДИЯ «ПРИМЕР» ★ ОБРАЗЕЦ ДЛЯ ДЕМОНСТРАЦИИ ★ ", 0, 0, 42 * k, 9 * k)
    c.setFont("SansBold", 12.5 * k)
    c.drawCentredString(0, 1 * k, "ДЕМО")
    c.setFont("SansBold", 6.8 * k)
    c.drawCentredString(0, -11 * k, "не документ")
    c.restoreState()


def certification_stamp(c):
    w, h = 176, 84
    c.saveState()
    c.translate(RIGHT - w - 6, 70)
    c.rotate(3)
    c.setStrokeColor(SEAL)
    c.setFillColor(SEAL)
    c.setStrokeAlpha(0.88)
    c.setFillAlpha(0.88)
    c.setLineWidth(2.4)
    c.roundRect(0, 0, w, h, 4, stroke=1, fill=0)
    c.setFont("SansBold", 15)
    c.drawString(12, h - 24, "КОПИЯ ВЕРНА")
    c.setFont("Sans", 9)
    c.drawString(12, h - 40, "Студия «Пример»")
    c.drawString(12, h - 55, "Демо-подписант")
    c.drawString(12, 11, "17.11.2026 · образец")
    c.restoreState()
    signature(c, RIGHT - w + 86, 70 + 42, 54)


for kind in ("source", "signing", "certification"):
    c = canvas.Canvas(str(OUT / f"{kind}.pdf"), pagesize=A4)
    c.setTitle(f"Подписание документов — {kind} — DEMO-001 (образец)")
    c.setAuthor("Yaroslav Yuferev — portfolio demo")
    c.setSubject("Вымышленный документ для демонстрации интерфейса")
    for page in (1, 2):
        chrome(c, page)
        if page == 1:
            page_one(c)
        else:
            x, y = page_two(c)
            if kind == "signing":
                signature(c, x + 2, y + 34, 112)
                seal(c, x + 112, y + 8, 120)
        if kind == "certification":
            certification_stamp(c)
        c.showPage()
    c.save()
    print("wrote", OUT / f"{kind}.pdf")
