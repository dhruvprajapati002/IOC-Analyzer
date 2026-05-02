"""
patch_report.py
---------------
Patches 220390107023_Internship_at_ForensicCyberTech_Report.docx:

  1. Inserts a "LIST OF FIGURES" page and a "LIST OF TABLES" page
     immediately before the existing "LIST OF ABBREVIATIONS" section.
  2. Updates the Table of Contents to include LOF / LOT entries.
  3. Embeds 5 PNG diagrams at appropriate chapter positions.
  4. Adds bold, centred table/figure captions near existing tables.
  5. Repacks everything into a new DOCX.

Usage:
    python scripts/patch_report.py
Output:
    220390107023_Internship_at_ForensicCyberTech_Report_PATCHED.docx
"""

import os
import re
import shutil
import zipfile

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX_IN  = os.path.join(BASE, "220390107023_Internship_at_ForensicCyberTech_Report.docx")
DOCX_OUT = os.path.join(BASE, "220390107023_Internship_at_ForensicCyberTech_Report_PATCHED.docx")
WORK     = os.path.join(BASE, "tmp", "report_patch_work")
IMGS_DIR = os.path.join(BASE, "docs", "diagrams")

# ── image source files ────────────────────────────────────────────────────────
IMAGES = {
    "rId9":  ("overview.png",               "ThreatLens System Overview"),
    "rId10": ("ioc-analysis-flow.png",       "IOC Analysis Flow"),
    "rId11": ("auth-flow.png",               "Authentication Flow"),
    "rId12": ("dashboard-history-flow.png",  "Dashboard and History Flow"),
    "rId13": ("file-graph-flow.png",         "File Analysis and Graph Module Flow"),
}

# ── XML helpers ───────────────────────────────────────────────────────────────
TNR = ('<w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" '
       'w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/>')

def _rpr(sz=22, bold=False, extra=""):
    b = "<w:b/><w:bCs/>" if bold else ""
    return f"<w:rPr>{b}<w:sz w:val=\"{sz}\"/><w:szCs w:val=\"{sz}\"/>{TNR}{extra}</w:rPr>"

def p_heading(text):
    return (
        f'    <w:p>\n'
        f'      <w:pPr><w:spacing w:before="480" w:after="240"/>'
        f'<w:jc w:val="center"/></w:pPr>\n'
        f'      <w:r>\n        {_rpr(32, bold=True)}\n'
        f'        <w:t xml:space="preserve">{text}</w:t>\n'
        f'      </w:r>\n    </w:p>'
    )

def p_blank():
    return ('    <w:p><w:pPr><w:spacing w:before="0" w:after="120"/>'
            '</w:pPr><w:r/></w:p>')

def p_page_break():
    return '    <w:p><w:r><w:br w:type="page"/></w:r></w:p>'

def p_toc_row(label, page, bold=False):
    b_tag = "<w:b/><w:bCs/>" if bold else '<w:b w:val="false"/><w:bCs w:val="false"/>'
    return (
        f'    <w:p>\n'
        f'      <w:pPr><w:tabs><w:tab w:val="right" w:pos="8666"/></w:tabs>'
        f'<w:spacing w:line="360" w:before="0" w:after="0"/>'
        f'<w:jc w:val="left"/></w:pPr>\n'
        f'      <w:r><w:rPr>{b_tag}<w:sz w:val="22"/><w:szCs w:val="22"/>{TNR}</w:rPr>'
        f'<w:t xml:space="preserve">{label}</w:t></w:r>\n'
        f'      <w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/>{TNR}</w:rPr>'
        f'<w:t xml:space="preserve">\t{page}</w:t></w:r>\n'
        f'    </w:p>'
    )

def p_caption(id_str, title, above=False):
    """Bold centred caption; above=True → more top spacing (for tables)."""
    before = "240" if above else "120"
    after  = "120" if above else "240"
    return (
        f'    <w:p>\n'
        f'      <w:pPr><w:spacing w:before="{before}" w:after="{after}"/>'
        f'<w:jc w:val="center"/></w:pPr>\n'
        f'      <w:r>\n        {_rpr(22, bold=True)}\n'
        f'        <w:t xml:space="preserve">{id_str}&#160;&#160;&#160;{title}</w:t>\n'
        f'      </w:r>\n    </w:p>'
    )

def p_image(rid, img_id, cx, cy, name):
    """Centred inline image paragraph."""
    return (
        f'    <w:p>\n'
        f'      <w:pPr><w:spacing w:before="240" w:after="120"/>'
        f'<w:jc w:val="center"/></w:pPr>\n'
        f'      <w:r>\n        {_rpr(22)}\n'
        f'        <w:drawing>\n'
        f'          <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">\n'
        f'            <wp:extent cx="{cx}" cy="{cy}"/>\n'
        f'            <wp:effectExtent l="0" t="0" r="0" b="0"/>\n'
        f'            <wp:docPr id="{img_id}" name="{name}"/>\n'
        f'            <wp:cNvGraphicFramePr>\n'
        f'              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>\n'
        f'            </wp:cNvGraphicFramePr>\n'
        f'            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">\n'
        f'              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">\n'
        f'                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">\n'
        f'                  <pic:nvPicPr>\n'
        f'                    <pic:cNvPr id="{img_id}" name="{name}"/>\n'
        f'                    <pic:cNvPicPr/>\n'
        f'                  </pic:nvPicPr>\n'
        f'                  <pic:blipFill>\n'
        f'                    <a:blip r:embed="{rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>\n'
        f'                    <a:stretch><a:fillRect/></a:stretch>\n'
        f'                  </pic:blipFill>\n'
        f'                  <pic:spPr>\n'
        f'                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>\n'
        f'                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>\n'
        f'                  </pic:spPr>\n'
        f'                </pic:pic>\n'
        f'              </a:graphicData>\n'
        f'            </a:graphic>\n'
        f'          </wp:inline>\n'
        f'        </w:drawing>\n'
        f'      </w:r>\n    </w:p>'
    )

# ── LIST OF FIGURES / TABLES data ─────────────────────────────────────────────
LOF = [
    ("Fig 1.1    Overview of ThreatLens Platform Architecture",           "1"),
    ("Fig 1.2    ForensicCyberTech Organisation Chart",                   "9"),
    ("Fig 2.1    Technology Stack — Layered Architecture",               "13"),
    ("Fig 2.2    API Integration — Parallel Orchestration Flow",         "16"),
    ("Fig 3.1    IOC Analysis Flow — Multi-Source Intelligence",         "24"),
    ("Fig 3.2    12-Week Sprint Gantt Chart",                            "40"),
    ("Fig 4.1    Activity Diagram — IOC Request Lifecycle",              "51"),
    ("Fig 4.2    System Architecture — Component Interaction",           "60"),
    ("Fig 5.1    Database Schema — IocCache and IocUserHistory",         "63"),
    ("Fig 5.2    Authentication Flow — JWT and Route Protection",        "67"),
    ("Fig 6.1    Dashboard and History Page Data Flow",                  "75"),
    ("Fig 6.2    File Analysis Engine and Graph Module Flow",            "81"),
    ("Fig 7.1    Risk Score Calculation Algorithm",                      "87"),
    ("Fig 8.1    MITRE ATT&amp;CK Tactic Coverage Map",                 "93"),
]

LOT = [
    ("Table 2.1    Technology Stack Overview",                           "13"),
    ("Table 2.2    API Integration Summary — Six Sources",              "16"),
    ("Table 2.3    Database Architecture and Index Design",             "19"),
    ("Table 3.1    12-Week Sprint Plan and Deliverables",               "40"),
    ("Table 4.1    Functional Requirements",                            "46"),
    ("Table 4.2    Technology Selection Justification",                 "57"),
    ("Table 5.1    IocCache Collection — Field Reference",              "63"),
    ("Table 5.2    IocUserHistory Collection — Field Reference",        "65"),
    ("Table 5.3    REST API Endpoint Design",                           "70"),
    ("Table 6.1    Module Implementation Summary",                      "75"),
    ("Table 6.2    Key Performance Metrics",                            "85"),
    ("Table 7.1    Complete Test Suite — 22 Test Cases",                "89"),
    ("Table 9.1    IOC Types — Pyramid of Pain Classification",         "97"),
    ("Table 9.2    MITRE ATT&amp;CK Tactics Coverage",                "100"),
    ("Table 12.1   OWASP Top 10 Compliance Assessment",               "110"),
    ("Table 13.1   API Response Time Analysis",                        "115"),
    ("Table 13.2   Frontend Lighthouse Performance Metrics",           "117"),
    ("Table 14.1   Skills Acquired — Pre/Post Comparison",            "122"),
]

# ── image insertion points ────────────────────────────────────────────────────
# (section_text_to_find, insert_BEFORE_that_section, rid, img_id, cx, cy, fig_cap_id, fig_cap_title)
W = 5_504_688   # ~6 inches in EMU
IMG_INSERTS = [
    # overview before section 1.2
    ("1.2   History and Evolution",
     "rId9", 1, W, 3_628_800,
     "Fig 1.1", "Overview of ThreatLens Platform Architecture and Integration Components"),

    # IOC flow before section 3.2
    ("3.2   Purpose",
     "rId10", 2, W, 4_572_000,
     "Fig 3.1", "IOC Analysis Flow — From Frontend Input to Multi-Source Intelligence Aggregation"),

    # Auth flow before section 5.3
    ("5.3   Input/Output and Interface Design",
     "rId11", 3, W, 4_115_520,
     "Fig 5.2", "Authentication Flow — JWT Token Lifecycle and Route Protection Architecture"),

    # Dashboard/history flow before section 6.2
    ("6.2   Module Implementation Details",
     "rId12", 4, W, 3_657_600,
     "Fig 6.1", "Dashboard and History Page Data Flow — Aggregation Pipeline and Chart Rendering"),

    # File/graph flow before section 6.3
    ("6.3   Key Features Implementation",
     "rId13", 5, W, 3_657_600,
     "Fig 6.2", "File Analysis Engine and Graph Module — Processing Pipeline and External Source Integration"),
]

# ── table caption insertion points ───────────────────────────────────────────
# (section_heading_text, caption_id, caption_title)
TABLE_CAPTIONS = [
    ("2.3   API Integration Architecture",
     "Table 2.2", "API Integration Summary — Six Threat Intelligence Sources, Rate Limits, and Key Data Fields"),
    ("2.4   Database Architecture",
     "Table 2.3", "Database Schema — IocCache and IocUserHistory Field Definitions and Index Strategy"),
    ("4.3   Requirements of New System",
     "Table 4.1", "Functional Requirements — Priority Classification and Implementation Status"),
    ("5.4   API Design",
     "Table 5.3", "REST API Endpoint Reference — Methods, Descriptions, and Authentication Requirements"),
    ("6.4   Results and Outcomes",
     "Table 6.2", "Key Performance Metrics — Project Targets vs Achieved Results"),
    ("7.2   Test Cases",
     "Table 7.1", "Complete Test Suite — 22 Test Cases Covering All Major Modules"),
    ("12.1   OWASP Top 10 Compliance Assessment",
     "Table 12.1", "OWASP Top 10 (2021) — Compliance Assessment and Mitigation Measures"),
    ("13.1   API Response Time Analysis",
     "Table 13.1", "API Response Time Analysis — Minimum, Average, Maximum, and P95 Latency"),
    ("13.2   Frontend Performance Metrics",
     "Table 13.2", "Frontend Performance Metrics — Lighthouse Scores and Web Vitals"),
]

# ─────────────────────────────────────────────────────────────────────────────

def unpack(docx_path, work_dir):
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)
    with zipfile.ZipFile(docx_path, 'r') as z:
        z.extractall(work_dir)
    print(f"  Unpacked -> {work_dir}")


def repack(work_dir, docx_out):
    if os.path.exists(docx_out):
        os.remove(docx_out)
    with zipfile.ZipFile(docx_out, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(work_dir):
            for f in files:
                full = os.path.join(root, f)
                rel  = os.path.relpath(full, work_dir).replace("\\", "/")
                zout.write(full, rel)
    print(f"  Repacked -> {docx_out}")


def add_image_relationships(rels_path):
    with open(rels_path, 'r', encoding='utf-8') as f:
        rels = f.read()

    # Only add if not already present
    new_rels = []
    for rid, (fname, _) in IMAGES.items():
        if rid not in rels:
            new_rels.append(
                f'  <Relationship Id="{rid}" '
                f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
                f'Target="media/{fname}"/>'
            )
    if new_rels:
        rels = rels.replace("</Relationships>", "\n".join(new_rels) + "\n</Relationships>")
        with open(rels_path, 'w', encoding='utf-8') as f:
            f.write(rels)
        print(f"  Added {len(new_rels)} image relationship(s)")
    else:
        print("  Image relationships already present")


def copy_images(media_dir):
    os.makedirs(media_dir, exist_ok=True)
    for rid, (fname, _) in IMAGES.items():
        src = os.path.join(IMGS_DIR, fname)
        dst = os.path.join(media_dir, fname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"  Copied image: {fname}")
        else:
            print(f"  WARNING: image not found: {src}")


def patch_document(doc_path):
    with open(doc_path, 'r', encoding='utf-8') as f:
        content = f.read()

    ok = []
    fail = []

    # ── 1. Build LOF + LOT XML blocks ────────────────────────────────────────
    lof_xml  = p_heading("LIST OF FIGURES") + "\n" + p_blank() + "\n"
    lof_xml += "\n".join(p_toc_row(lbl, pg) for lbl, pg in LOF)
    lof_xml += "\n" + p_page_break() + "\n"

    lot_xml  = p_heading("LIST OF TABLES") + "\n" + p_blank() + "\n"
    lot_xml += "\n".join(p_toc_row(lbl, pg) for lbl, pg in LOT)
    lot_xml += "\n" + p_page_break() + "\n"

    # ── 2. Insert LOF + LOT before LIST OF ABBREVIATIONS ─────────────────────
    # Find the page break + heading paragraph that starts LIST OF ABBREVIATIONS
    loa_idx = content.find("LIST OF ABBREVIATIONS")
    if loa_idx == -1:
        fail.append("LOF/LOT insertion — LIST OF ABBREVIATIONS not found")
    else:
        # Walk back to the <w:p> that contains the page break before it
        para_pb_start = content.rfind("<w:p>", 0, loa_idx - 200)
        # Go one more paragraph back (the page break paragraph)
        para_pb_start2 = content.rfind("<w:p>", 0, para_pb_start - 1)
        insert_pos = para_pb_start2
        content = content[:insert_pos] + lof_xml + "\n" + lot_xml + "\n" + content[insert_pos:]
        ok.append("Inserted LIST OF FIGURES and LIST OF TABLES pages")

    # ── 3. Update Table of Contents — add LOF/LOT entries after Abstract ─────
    abstract_t_marker = '<w:t xml:space="preserve">Abstract</w:t>'
    toc_idx = content.find(abstract_t_marker)
    if toc_idx == -1:
        fail.append("TOC update — 'Abstract' marker not found")
    else:
        para_end = content.find("</w:p>", toc_idx) + len("</w:p>")
        new_entries = (
            "\n" + p_toc_row("List of Figures", "iii") +
            "\n" + p_toc_row("List of Tables",  "iv")  + "\n"
        )
        content = content[:para_end] + new_entries + content[para_end:]
        ok.append("Updated TOC with List of Figures and List of Tables")

    # ── 4. Insert images at chapter positions ─────────────────────────────────
    for (section_text, rid, img_id, cx, cy, cap_id, cap_title) in IMG_INSERTS:
        marker = f'<w:t xml:space="preserve">{section_text}</w:t>'
        idx = content.find(marker)
        if idx == -1:
            fail.append(f"Image {rid} — section marker not found: '{section_text}'")
            continue
        # Find start of the paragraph containing this marker
        para_start = content.rfind("<w:p>", 0, idx)
        img_name = IMAGES[rid][1]
        block = (
            "\n" + p_blank() + "\n"
            + p_image(rid, img_id, cx, cy, img_name) + "\n"
            + p_caption(cap_id, cap_title, above=False) + "\n"
            + p_blank() + "\n"
        )
        content = content[:para_start] + block + content[para_start:]
        ok.append(f"Inserted image {rid} ({img_name}) before '{section_text}'")

    # ── 5. Add table captions ─────────────────────────────────────────────────
    for (section_text, cap_id, cap_title) in TABLE_CAPTIONS:
        marker = f'<w:t xml:space="preserve">{section_text}</w:t>'
        idx = content.find(marker)
        if idx == -1:
            # Try with leading spaces (e.g. "   2.3")
            for prefix in ["   ", "  ", " "]:
                alt = f'<w:t xml:space="preserve">{prefix}{section_text}</w:t>'
                idx = content.find(alt)
                if idx != -1:
                    marker = alt
                    break
        if idx == -1:
            fail.append(f"Table caption {cap_id} — section not found: '{section_text}'")
            continue
        # Find the first <w:tbl> after the section heading (within 6 kB)
        tbl_idx = content.find("<w:tbl>", idx)
        if tbl_idx == -1 or tbl_idx - idx > 12000:
            fail.append(f"Table caption {cap_id} — no nearby <w:tbl> after '{section_text}'")
            continue
        cap_xml = "\n" + p_caption(cap_id, cap_title, above=True) + "\n"
        content = content[:tbl_idx] + cap_xml + content[tbl_idx:]
        ok.append(f"Added caption for {cap_id}")

    # ── Write back ────────────────────────────────────────────────────────────
    with open(doc_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # ── Report ────────────────────────────────────────────────────────────────
    print(f"\n  OK: {len(ok)} modifications applied:")
    for m in ok:
        print(f"    [OK]  {m}")
    if fail:
        print(f"\n  WARN: {len(fail)} items could not be applied:")
        for m in fail:
            print(f"    [!!]  {m}")
    return len(fail) == 0


# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Patching Internship Report DOCX ===\n")

    if not os.path.exists(DOCX_IN):
        raise FileNotFoundError(f"Source DOCX not found: {DOCX_IN}")

    # Step 1 — unpack
    print("[1/5] Unpacking DOCX …")
    unpack(DOCX_IN, WORK)

    word_dir  = os.path.join(WORK, "word")
    doc_xml   = os.path.join(word_dir, "document.xml")
    rels_file = os.path.join(word_dir, "_rels", "document.xml.rels")
    media_dir = os.path.join(word_dir, "media")

    # Step 2 — copy images into media/
    print("\n[2/5] Copying diagram images …")
    copy_images(media_dir)

    # Step 3 — add relationships
    print("\n[3/5] Updating document relationships …")
    add_image_relationships(rels_file)

    # Step 4 — patch document.xml
    print("\n[4/5] Patching document.xml …")
    patch_document(doc_xml)

    # Step 5 — repack
    print("\n[5/5] Repacking DOCX …")
    repack(WORK, DOCX_OUT)

    # Cleanup
    shutil.rmtree(WORK, ignore_errors=True)

    print(f"\nDONE!  Output: {DOCX_OUT}\n")


if __name__ == "__main__":
    main()
