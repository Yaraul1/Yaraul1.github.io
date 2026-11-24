/*
  What the editor on the left desk monitor shows (Monitors.tsx): two real fragments of the
  LegalHub backend, the stamp resolver and the stamping helper.
*/

export const resolverCode = `# An organization-only stamp is a fallback for documents that nobody
# from the catalog personally signs. As soon as a known signatory is
# identified anywhere in the document, that person's stamp is the signature.
if _document_has_named_signatory(observations):
    organization_only_targets = []
    organization_only_direct_targets = []
else:
    organization_only_targets = _collect_organization_only_targets(...)


def _unique_template(templates):
    unique_by_id = {t.stamp_template_id: t for t in templates}
    if len(unique_by_id) != 1:
        return None  # ambiguous -> skip, never guess
    return next(iter(unique_by_id.values()))`;

export const stampCode = `def _img_to_pdf(x_img, y_img, page_w, page_h, img_size):
    iw, ih = img_size
    return x_img * (page_w / iw), page_h - y_img * (page_h / ih)


def _build_stamp_overlay(page_w, page_h, x_pt, y_pt, stamp_bytes):
    mark = load_mark_image(stamp_bytes)  # trims blank margins, reads DPI
    sw, sh = resolve_mark_size_pt(mark, page_width_pt=page_w, page_height_pt=page_h)
    # The AI returns the centre of the stamp; keep the whole mark on the page.
    x0 = min(max(0.0, x_pt - sw / 2), max(0.0, page_w - sw))
    y0 = min(max(0.0, y_pt - sh / 2), max(0.0, page_h - sh))
    c = Canvas(packet, pagesize=(page_w, page_h))
    c.drawImage(ImageReader(BytesIO(mark_to_png_bytes(mark))), x0, y0,
                width=sw, height=sh, mask="auto",
                preserveAspectRatio=True, anchor="sw")`;
