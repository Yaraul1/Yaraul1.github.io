"""Build fictional, clearly marked PDF assets for the portfolio demo.

Requires reportlab. This does not call or reproduce the production processor.
"""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/demos/legalhub"
OUT.mkdir(parents=True, exist_ok=True)
FONT_ROOT = Path("/System/Library/Fonts/Supplemental")
pdfmetrics.registerFont(TTFont("DemoArial", str(FONT_ROOT / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("DemoArialBold", str(FONT_ROOT / "Arial Bold.ttf")))
W, H = A4
INK = colors.HexColor("#343c43")
MUTED = colors.HexColor("#89979f")
BLUE = colors.HexColor("#426eb5")
style = ParagraphStyle("Body", fontName="DemoArial", fontSize=11, leading=20, textColor=INK)


def text(c, x, y, value, size=11, bold=False, color=INK):
    c.setFillColor(color)
    c.setFont("DemoArialBold" if bold else "DemoArial", size)
    c.drawString(x, y, value)


def paragraph(c, y, value, x=55, width=W - 110):
    p = Paragraph(value, style)
    _, height = p.wrap(width, 200)
    p.drawOn(c, x, y - height)
    return y - height


def section(c, y, heading, body):
    text(c, 55, y, heading, bold=True)
    return paragraph(c, y - 15, body) - 30


def stamp(c, workflow):
    c.saveState()
    if workflow == "signing":
        c.translate(72, 334)
        c.rotate(-5)
        c.setStrokeColor(BLUE)
        c.setLineWidth(1)
        c.rect(0, 0, 235, 50)
        text(c, 12, 29, "ДЕМО-ПОДПИСЬ", 17, True, BLUE)
        text(c, 12, 12, "Студия «Пример» - ОБРАЗЕЦ", 9, color=BLUE)
    else:
        c.translate(65, 160)
        c.rotate(-3)
        c.setStrokeColor(BLUE)
        c.rect(0, 0, 230, 73)
        text(c, 14, 47, "КОПИЯ ВЕРНА", 18, True, BLUE)
        text(c, 14, 29, "ДЕМО - Студия «Пример»", 10, color=BLUE)
        text(c, 14, 13, "17.11.2026 - ОБРАЗЕЦ", 9, color=BLUE)
    c.restoreState()


for workflow in ("source", "signing", "certification"):
    c = canvas.Canvas(str(OUT / f"{workflow}.pdf"), pagesize=A4)
    c.setTitle(f"LegalHub - {workflow} - DEMO-001")
    c.setAuthor("Yaroslav Yuferev - portfolio demo")
    for page in (1, 2):
        c.saveState()
        c.translate(W / 2, H / 2)
        c.rotate(35)
        c.setFillColor(colors.HexColor("#f0f3f6"))
        c.setFont("DemoArialBold", 70)
        c.drawCentredString(0, 0, "ОБРАЗЕЦ")
        c.restoreState()
        text(c, 55, H - 55, "СТУДИЯ «ПРИМЕР»", 9, color=MUTED)
        text(c, W - 135, H - 55, "ДЕМО / 001", 9, color=MUTED)
        c.setStrokeColor(colors.HexColor("#e1e6ea"))
        c.line(55, H - 70, W - 55, H - 70)
        text(c, 55, H - 115, "Договор оказания услуг" if page == 1 else "Условия и реквизиты", 24, True)
        text(c, 55, H - 140, "№ DEMO-001 - 17 ноября 2026", 10, color=MUTED)
        y = H - 190
        if page == 1:
            y = section(c, y, "1. Предмет договора", "Студия «Пример» и компания «Демо» договорились о разработке демонстрационного программного интерфейса.")
            y = section(c, y, "2. Порядок выполнения", "Исполнитель подготавливает макет, согласовывает его с заказчиком и передаёт результат для ознакомления.")
            y = section(c, y, "3. Приёмка результата", "Результат передаётся в электронном виде. Стороны проверяют соответствие согласованному заданию.")
            paragraph(c, y - 5, "Все названия и условия вымышлены.<br/>Документ создан для демонстрации интерфейса.")
        else:
            y = section(c, y, "4. Заключительные положения", "Изменения условий оформляются по взаимному согласованию сторон. Договор состоит из двух страниц.")
            text(c, 55, y, "5. Реквизиты сторон", bold=True)
            paragraph(c, y - 20, "Заказчик<br/>Компания «Демо»<br/>Демонстрационные данные", width=220)
            paragraph(c, y - 20, "Исполнитель<br/>Студия «Пример»<br/>Демонстрационные данные", x=310, width=230)
            text(c, 65, 415, "От исполнителя", 10)
            text(c, 65, 380, "________________ / Демо-подписант /", 10)
        if workflow == "certification" or (workflow == "signing" and page == 2):
            stamp(c, workflow)
        c.setStrokeColor(colors.HexColor("#e1e6ea"))
        c.line(55, 65, W - 55, 65)
        text(c, 55, 48, "Образец для портфолио. Не является подписанным документом.", 8, color=MUTED)
        text(c, W - 85, 48, f"{page} / 2", 8, color=MUTED)
        c.showPage()
    c.save()
    print(OUT / f"{workflow}.pdf")
