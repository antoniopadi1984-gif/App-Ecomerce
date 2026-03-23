#!/usr/bin/env python3
"""
subtitle_injector.py — Professional Subtitle & On-Screen Text Masking + Overlay
 
Features:
- Dual SRT mode: --srt-orig for masking timing, --srt for overlay timing
- Multi-frame OCR (3 snapshots per block to maximize detection)
- White/Black box detection via contour analysis
- Dynamic drawbox patching (solid color, timed per block)
- Precise ASS positioning at detected region center
- Full bounds checking to avoid FFmpeg crashes
- Fallback to previous region if detection fails for a block
"""
 
import argparse
import subprocess
import sys
import os
import re
import tempfile
import json
from typing import Optional
 
try:
    import cv2
    import numpy as np
except ImportError:
    print("[ERROR] OpenCV not installed. Run: pip install opencv-python numpy", file=sys.stderr)
    sys.exit(1)
 
try:
    import pytesseract
    from PIL import Image as PILImage
except ImportError:
    print("[ERROR] Pytesseract/PIL not installed.", file=sys.stderr)
    sys.exit(1)
 
# ─────────────────────────────────────────────
# Binary Paths
# ─────────────────────────────────────────────
FFPROBE = os.environ.get('FFPROBE_PATH', '/opt/homebrew/bin/ffprobe')
if not os.path.exists(FFPROBE): FFPROBE = 'ffprobe'
 
FFMPEG_BIN = os.environ.get('FFMPEG_PATH', '/usr/local/ffmpeg-libass/bin/ffmpeg')
if not os.path.exists(FFMPEG_BIN): FFMPEG_BIN = 'ffmpeg'
 
 
# ─────────────────────────────────────────────
# Video Utilities
# ─────────────────────────────────────────────
def get_video_dims(video_path: str) -> tuple:
    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height", "-of", "json", video_path],
            capture_output=True, text=True, timeout=15
        )
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        if streams and streams[0].get("width") and streams[0].get("height"):
            return int(streams[0]["width"]), int(streams[0]["height"])
    except Exception:
        pass
    return 720, 1280
 
 
def extract_frame(video_path: str, out_path: str, t: float) -> bool:
    subprocess.run(
        [FFMPEG_BIN, "-y", "-ss", f"{t:.3f}", "-i", video_path,
         "-vframes", "1", "-q:v", "2", out_path],
        capture_output=True, check=False
    )
    return os.path.exists(out_path)
 
 
# ─────────────────────────────────────────────
# SRT Parser
# ─────────────────────────────────────────────
def parse_srt(srt_path: str) -> list:
    entries = []
    if not srt_path or not os.path.exists(srt_path):
        return entries
    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()
    blocks = re.split(r'\n\s*\n', content.strip())
    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) < 3: continue
        m = re.match(r'(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)', lines[1])
        if not m: continue
        h1,m1,s1,ms1,h2,m2,s2,ms2 = [int(x) for x in m.groups()]
        start_ms = (h1*3600 + m1*60 + s1)*1000 + ms1
        end_ms   = (h2*3600 + m2*60 + s2)*1000 + ms2
        raw_text = " ".join(lines[2:]).replace("\n", " ").strip()
        # Word wrap at 6 words
        words = raw_text.split()
        if len(words) > 6:
            mid = (len(words)+1)//2
            text = " ".join(words[:mid]) + "\\N" + " ".join(words[mid:])
        else:
            text = raw_text
        entries.append({"start_ms": start_ms, "end_ms": end_ms, "text": text, "region": None})
    return entries
 
 
# ─────────────────────────────────────────────
# Region Detection
# ─────────────────────────────────────────────
def detect_subtitle_region(frame_path: str, vw: int, vh: int) -> Optional[dict]:
    img = cv2.imread(frame_path)
    if img is None: return None
    h, w = img.shape[:2]
    candidates = []
 
    # OCR detection — detecta TODOS los grupos de texto en el frame completo
    try:
        pil_img = PILImage.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT,
                                          config="--psm 11 --oem 3")
        elements = []
        for i, conf in enumerate(data["conf"]):
            if int(conf) < 45: continue
            tx = data["text"][i].strip()
            if not tx or len(tx) < 2: continue
            bx, by, bw, bh = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
            if bw > 5 and bh > 5:
                elements.append((bx, by, bx+bw, by+bh))

        if elements:
            # Agrupar por proximidad vertical — cada grupo es un bloque de texto independiente
            elements.sort(key=lambda e: e[1])
            groups = []
            current = [elements[0]]
            for e in elements[1:]:
                # Nueva línea si hay gap vertical > 30px
                if e[1] - current[-1][3] > 30:
                    groups.append(current)
                    current = [e]
                else:
                    current.append(e)
            groups.append(current)

            # Cada grupo es una región candidata independiente
            for group in groups:
                min_x = max(0, min(e[0] for e in group) - 8)
                min_y = max(0, min(e[1] for e in group) - 8)
                max_x = min(w, max(e[2] for e in group) + 8)
                max_y = min(vh, max(e[3] for e in group) + 8)
                area_w = max_x - min_x
                area_h = max_y - min_y
                # Filtrar: debe ser razonablemente ancho y no demasiado alto
                if area_w > w * 0.08 and area_h > 8 and area_h < vh * 0.3:
                    candidates.append({
                        "yTop": min_y, "yBottom": max_y, "xLeft": min_x, "xRight": max_x,
                        "fontSize": max(14, min(60, int(area_h * 0.85))),
                        "score": area_w * area_h * 2
                    })
    except Exception as e:
        print(f"[DEBUG] OCR error: {e}", file=sys.stderr)
 
    # Geometry detection — solid white/black boxes
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        for invert in [False, True]:
            proc = cv2.bitwise_not(gray) if invert else gray
            _, thresh = cv2.threshold(proc, 220, 255, cv2.THRESH_BINARY)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w//10, 5))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in cnts:
                cx, cy, cw, ch = cv2.boundingRect(cnt)
                if cw > w*0.15 and ch > 20 and ch < vh*0.4 and cw/ch > 1.2:
                    candidates.append({
                        "yTop": cy, "yBottom": cy+ch, "xLeft": cx, "xRight": cx+cw,
                        "fontSize": max(14, min(80, int(ch*0.8))),
                        "score": cw * ch
                    })
    except Exception as e:
        print(f"[DEBUG] Geometry error: {e}", file=sys.stderr)
 
    if not candidates: return None

    def overlaps(a, b):
        ix1 = max(a["xLeft"], b["xLeft"]); ix2 = min(a["xRight"], b["xRight"])
        iy1 = max(a["yTop"],  b["yTop"]);  iy2 = min(a["yBottom"], b["yBottom"])
        if ix2 <= ix1 or iy2 <= iy1: return False
        inter = (ix2-ix1)*(iy2-iy1)
        area_a = (a["xRight"]-a["xLeft"])*(a["yBottom"]-a["yTop"])
        return inter / max(area_a, 1) > 0.7

    unique = []
    for c in sorted(candidates, key=lambda x: -x["score"]):
        if not any(overlaps(c, u) for u in unique):
            unique.append(c)

    return unique
 
 
def get_dominant_bg_color(frame_path: str, region: dict) -> str:
    img = cv2.imread(frame_path)
    if img is None: return "white"
    h, w = img.shape[:2]
    y1, y2 = max(0, region["yTop"]), min(h, region["yBottom"])
    x1, x2 = max(0, region["xLeft"]), min(w, region["xRight"])
    crop = img[y1:y2, x1:x2]
    if crop.size == 0: return "white"
    avg = np.average(np.average(crop, axis=0), axis=0)
    brightness = 0.299*avg[2] + 0.587*avg[1] + 0.114*avg[0]
    return "white" if brightness > 127 else "black"
 
 
# ─────────────────────────────────────────────
# ASS Generation
# ─────────────────────────────────────────────
def ms_to_ass(ms: int) -> str:
    cs = ms // 10
    s, cs = divmod(cs, 100)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"
 
 
def generate_ass(entries: list, vw: int, vh: int, out_path: str):
    header = f"""[Script Info]
PlayResX: {vw}
PlayResY: {vh}
ScaledBorderAndShadow: yes
 
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Arial,20,&H00000000,&H000000FF,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,4,2,0,2,10,10,10,1
 
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    events = ""
    for e in entries:
        start = ms_to_ass(e["start_ms"])
        end   = ms_to_ass(e["end_ms"])
        if e.get("region"):
            r = e["region"]
            pos_x = (r["xLeft"] + r["xRight"]) // 2
            pos_y = r["yBottom"] - max(2, (r["yBottom"] - r["yTop"]) // 6)
            fs = max(16, r["fontSize"])
            tags = f"{{\\pos({pos_x},{pos_y})\\fs{fs}\\bord1\\shad0}}"
        else:
            fs = max(20, int(vh * 0.035))
            tags = f"{{\\pos({vw//2},{int(vh*0.88)})\\fs{fs}\\bord1\\shad0}}"
        events += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{tags}{e['text']}\n"
 
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header + events)
 
 
# ─────────────────────────────────────────────
# FFmpeg Injection
# ─────────────────────────────────────────────
def inject_subtitles(video_path: str, ass_path: str, mask_entries: list,
                     vw: int, vh: int, out_path: str, tmp_dir: str) -> bool:
    filters = []
    chain_idx = 0
    curr_stream = "[0:v]"
 
    for i, e in enumerate(mask_entries):
        regions = e.get("regions") or ([e["region"]] if e.get("region") else [])
        if not regions: continue
        r = regions[0]  # para compatibilidad
        ts = e["start_ms"] / 1000.0
        te = e["end_ms"] / 1000.0
        f_path = os.path.join(tmp_dir, f"mask_{i}_50.jpg")
        for r in regions:
            px, py = 8, 8
            x = max(0, r["xLeft"] - px)
            y = max(0, r["yTop"] - py)
            w = min(vw - x - 1, r["xRight"] - r["xLeft"] + px*2)
            h = min(vh - y - 1, r["yBottom"] - r["yTop"] + py*2)
            if w < 4 or h < 4: continue
            bg = get_dominant_bg_color(f_path, r) if os.path.exists(f_path) else "white"
            out_stream = f"[v_patch{chain_idx}]"
            filters.append(f"{curr_stream}drawbox=x={x}:y={y}:w={w}:h={h}:color={bg}:t=fill:enable='between(t,{ts:.3f},{te:.3f})'{out_stream}")
            curr_stream = out_stream
            chain_idx += 1
 
    filter_str = ";".join(filters)
    if filter_str: filter_str += ";"
    safe_ass = ass_path.replace("\\", "/").replace(":", "\\:")
    filter_str += f"{curr_stream}ass='{safe_ass}'"
 
    cmd = [
        FFMPEG_BIN, "-y", "-i", video_path,
        "-filter_complex", filter_str,
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "copy", out_path
    ]
 
    print(f"[FFmpeg] Patching {chain_idx} zones + ASS overlay...", file=sys.stderr)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[FFmpeg] FAILED:\n{result.stderr[-1500:]}", file=sys.stderr)
        return False
    return True
 
 
# ─────────────────────────────────────────────
# Region Detection Loop
# ─────────────────────────────────────────────
def detect_regions_for_entries(entries: list, video_path: str, vw: int, vh: int,
                                tmp_dir: str, prefix: str = "f") -> list:
    last_regions = []
    for i, e in enumerate(entries):
        candidates = []
        dur = (e["end_ms"] - e["start_ms"]) / 1000.0
        for off in [0.25, 0.5, 0.75]:
            t = (e["start_ms"] / 1000.0) + (dur * off)
            fp = os.path.join(tmp_dir, f"{prefix}_{i}_{int(off*100)}.jpg")
            if extract_frame(video_path, fp, t):
                reg = detect_subtitle_region(fp, vw, vh)
                if reg: candidates.append(reg)
 
        # Combinar todos los candidatos de los 3 frames — deduplicar
        all_regions = []
        for reg in candidates:
            if isinstance(reg, list):
                all_regions.extend(reg)
            elif reg:
                all_regions.append(reg)

        if all_regions:
            # Deduplicar entre frames
            unique = []
            def overlaps(a, b):
                ix1=max(a["xLeft"],b["xLeft"]); ix2=min(a["xRight"],b["xRight"])
                iy1=max(a["yTop"],b["yTop"]); iy2=min(a["yBottom"],b["yBottom"])
                if ix2<=ix1 or iy2<=iy1: return False
                inter=(ix2-ix1)*(iy2-iy1)
                area_a=(a["xRight"]-a["xLeft"])*(a["yBottom"]-a["yTop"])
                return inter/max(area_a,1)>0.7
            for c in sorted(all_regions, key=lambda x: -x["score"]):
                if not any(overlaps(c,u) for u in unique): unique.append(c)
            e["regions"] = unique
            last_regions = unique
            print(f"  [{i+1}/{len(entries)}] ✓ {len(unique)} region(s) detected", file=sys.stderr)
        elif last_regions:
            e["regions"] = last_regions
            print(f"  [{i+1}/{len(entries)}] ~ fallback to last regions", file=sys.stderr)
        else:
            e["regions"] = []
            print(f"  [{i+1}/{len(entries)}] ✗ not detected", file=sys.stderr)
    return entries
 
 
# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Smart subtitle injector with dynamic masking")
    parser.add_argument("--video",    required=True,  help="Input video (already has TTS audio)")
    parser.add_argument("--srt",      required=True,  help="SRT of TRANSLATED text (for overlay)")
    parser.add_argument("--out",      required=True,  help="Output video path")
    parser.add_argument("--srt-orig", default="",     help="SRT of ORIGINAL text (for masking timing)")
    args = parser.parse_args()
 
    vw, vh = get_video_dims(args.video)
    print(f"[INFO] Video: {vw}x{vh}", file=sys.stderr)
 
    # Translated entries — for ASS overlay timing
    overlay_entries = parse_srt(args.srt)
    if not overlay_entries:
        print("[ERROR] Translated SRT is empty", file=sys.stderr)
        sys.exit(1)
 
    with tempfile.TemporaryDirectory() as tmp:
 
        # ── MASKING ENTRIES ──────────────────────────────────────────────────
        # If we have the original SRT, use it for masking timing (more precise)
        # Otherwise fall back to translated SRT timing
        if args.srt_orig and os.path.exists(args.srt_orig):
            print(f"[INFO] Dual-SRT mode: masking from original, overlay from translated", file=sys.stderr)
            mask_entries = parse_srt(args.srt_orig)
            print(f"[INFO] Detecting regions from ORIGINAL video ({len(mask_entries)} blocks)...", file=sys.stderr)
            mask_entries = detect_regions_for_entries(mask_entries, args.video, vw, vh, tmp, prefix="mask")
        else:
            print(f"[INFO] Single-SRT mode: using translated SRT for both masking and overlay", file=sys.stderr)
            mask_entries = overlay_entries
            print(f"[INFO] Detecting regions ({len(mask_entries)} blocks)...", file=sys.stderr)
            mask_entries = detect_regions_for_entries(mask_entries, args.video, vw, vh, tmp, prefix="mask")
            # Share detected regions with overlay entries (same timing)
            for i, e in enumerate(overlay_entries):
                if i < len(mask_entries):
                    e["region"] = mask_entries[i].get("region")
 
        # ── OVERLAY ENTRIES — inherit regions from mask ──────────────────────
        # For dual-SRT mode: each overlay entry gets the region from the
        # closest-in-time mask entry (since timings differ)
        if args.srt_orig and os.path.exists(args.srt_orig):
            for oe in overlay_entries:
                oe_mid = (oe["start_ms"] + oe["end_ms"]) / 2
                best_me = None
                best_diff = float("inf")
                for me in mask_entries:
                    if me.get("region"):
                        me_mid = (me["start_ms"] + me["end_ms"]) / 2
                        diff = abs(oe_mid - me_mid)
                        if diff < best_diff:
                            best_diff = diff
                            best_me = me
                if best_me:
                    oe["regions"] = best_me.get("regions", [])
 
        # ── GENERATE ASS ────────────────────────────────────────────────────
        ass_path = os.path.join(tmp, "subs.ass")
        generate_ass(overlay_entries, vw, vh, ass_path)
 
        # ── INJECT ──────────────────────────────────────────────────────────
        ok = inject_subtitles(args.video, ass_path, mask_entries, vw, vh, args.out, tmp)
        if not ok:
            sys.exit(1)
 
    print(f"[DONE] Output: {args.out}", file=sys.stderr)
 
 
if __name__ == "__main__":
    main()
