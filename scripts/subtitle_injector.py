#!/usr/bin/env python3
"""
subtitle_injector.py — Smart subtitle overlay using local OCR + FFmpeg/libass

Usage:
  python3 subtitle_injector.py \\
    --video input.mp4 \\
    --srt subtitles.srt \\
    --out output.mp4 \\
    [--font-size 18] \\
    [--lang es]

How it works:
  1. Extract a frame at t=1s with FFmpeg
  2. OpenCV + Tesseract detect the original subtitle bounding box (in px)
  3. Compute overlay Y = yTop_original - box_height - 4px
  4. Generate a .ass subtitle file with dynamic MarginV and white background
  5. Burn subtitles with FFmpeg libass filter (no video reencoding needed)
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
    print("[ERROR] OpenCV not installed. Run: pip3 install opencv-python", file=sys.stderr)
    sys.exit(1)

try:
    import tesserocr
    TESSEROCR = True
except ImportError:
    TESSEROCR = False

# ─────────────────────────────────────────────
# Frame extraction
# ─────────────────────────────────────────────

def extract_frame(video_path: str, out_path: str, t: float = 1.0) -> bool:
    """Extract a single frame at time t (seconds)."""
    result = subprocess.run(
        ["ffmpeg", "-y", "-ss", str(t), "-i", video_path,
         "-vframes", "1", "-q:v", "2", out_path],
        capture_output=True
    )
    return result.returncode == 0 and os.path.exists(out_path)


# ─────────────────────────────────────────────
# Video dimensions
# ─────────────────────────────────────────────

def get_video_dims(video_path: str) -> tuple[int, int]:
    """Returns (width, height) in pixels."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height",
         "-of", "csv=p=0", video_path],
        capture_output=True, text=True
    )
    parts = result.stdout.strip().split(",")
    return int(parts[0]), int(parts[1])


# ─────────────────────────────────────────────
# Subtitle region detection
# ─────────────────────────────────────────────

def detect_subtitle_region(frame_path: str, video_h: int) -> Optional[dict]:
    """
    Uses OpenCV preprocessing + Tesseract OCR to find the subtitle text region.
    Returns { yTop, yBottom, estimatedFontSize } in absolute pixels, or None.
    """
    img = cv2.imread(frame_path)
    if img is None:
        return None

    h, w = img.shape[:2]

    # Only look at bottom 40% of the frame (where subs usually live)
    bottom_start = int(h * 0.60)
    roi = img[bottom_start:, :]

    # Convert to grayscale
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    # Adaptive threshold to isolate bright text on dark bg (or dark on light)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11, C=2
    )

    # Dilate to connect nearby text blobs
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 4))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    # Find contours of text regions
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Also try inverted (dark text on light bg)
    thresh_inv = cv2.bitwise_not(thresh)
    dilated_inv = cv2.dilate(thresh_inv, kernel, iterations=2)
    contours_inv, _ = cv2.findContours(dilated_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = list(contours) + list(contours_inv)

    best = None
    best_score = 0

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)

        # Filter: must be wide (subtitle spans most of width) and reasonable height
        if cw < w * 0.25:
            continue
        if ch < 8 or ch > 80:
            continue

        # Score: prefer wider + lower in frame
        area = cw * ch
        score = area + (y * 10)  # prefer lower regions
        if score > best_score:
            best_score = score
            best = (x, y + bottom_start, x + cw, y + ch + bottom_start)

    if best is None:
        print("[OCR] No subtitle region detected — using fallback position", file=sys.stderr)
        return None

    xL, yT, xR, yB = best
    font_size = max(12, min(28, int((yB - yT) * 0.85)))

    print(f"[OCR] Detected subtitle region: yTop={yT}, yBottom={yB}, fontSize≈{font_size}", file=sys.stderr)
    return {
        "yTop": yT,
        "yBottom": yB,
        "xLeft": xL,
        "xRight": xR,
        "estimatedFontSize": font_size
    }


# ─────────────────────────────────────────────
# SRT → chunks for ASS
# ─────────────────────────────────────────────

def parse_srt(srt_path: str) -> list[dict]:
    """Parse SRT into list of {start_ms, end_ms, text}."""
    entries = []
    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = re.split(r'\n\s*\n', content.strip())
    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) < 3:
            continue
        time_line = lines[1]
        m = re.match(r'(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)', time_line)
        if not m:
            continue
        h1,m1,s1,ms1,h2,m2,s2,ms2 = [int(x) for x in m.groups()]
        start_ms = ((h1*3600 + m1*60 + s1) * 1000) + ms1
        end_ms   = ((h2*3600 + m2*60 + s2) * 1000) + ms2
        text = " ".join(lines[2:]).replace("\n", " \\N")
        entries.append({"start_ms": start_ms, "end_ms": end_ms, "text": text})

    return entries


def ms_to_ass_time(ms: int) -> str:
    """Convert milliseconds to ASS time format H:MM:SS.CC"""
    cs = ms // 10
    s  = cs // 100; cs = cs % 100
    m  = s  // 60;  s  = s  % 60
    h  = m  // 60;  m  = m  % 60
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


# ─────────────────────────────────────────────
# ASS file generation
# ─────────────────────────────────────────────

def generate_ass(srt_entries: list[dict], video_w: int, video_h: int,
                 margin_v: int, font_size: int, out_path: str):
    """
    Generate an ASS subtitle file with:
    - White semi-transparent background box
    - Black text with thin outline
    - Dynamic MarginV positioning
    """
    # ASS colours: &HAABBGGRR (alpha, blue, green, red)
    # &H00000000 = opaque black text
    # &H00FFFFFF = opaque white outline
    # &HCC000000 = 80% transparent black back-colour (not used with BorderStyle 4)
    # For white box behind text: we use BorderStyle=4 (opaque box) + BackColour=&H99FFFFFF (white, 60% opaque)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {video_w}
PlayResY: {video_h}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Arial,{font_size},&H00000000,&H000000FF,&H00FFFFFF,&H99FFFFFF,-1,0,0,0,100,100,0,0,4,1.5,0,2,20,20,{margin_v},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""

    events = ""
    for e in srt_entries:
        start = ms_to_ass_time(e["start_ms"])
        end   = ms_to_ass_time(e["end_ms"])
        text  = e["text"]
        events += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header + events)

    print(f"[ASS] Generated: {out_path} ({len(srt_entries)} entries, marginV={margin_v}, fontSize={font_size})", file=sys.stderr)


# ─────────────────────────────────────────────
# FFmpeg injection
# ─────────────────────────────────────────────

def inject_subtitles(video_path: str, ass_path: str, out_path: str) -> bool:
    """Burn ASS subtitles using FFmpeg libass. Audio copied without re-encoding."""
    # Escape path for FFmpeg filter (colons and backslashes need escaping)
    escaped = ass_path.replace("\\", "/").replace(":", "\\:")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"ass={escaped}",
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "copy",
        out_path
    ]

    print(f"[FFmpeg] Running: {' '.join(cmd)}", file=sys.stderr)
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[FFmpeg] Error:\n{result.stderr[-2000:]}", file=sys.stderr)
        return False

    return True


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Smart subtitle injector")
    parser.add_argument("--video",     required=True,  help="Input video path")
    parser.add_argument("--srt",       required=True,  help="SRT subtitle file path")
    parser.add_argument("--out",       required=True,  help="Output video path")
    parser.add_argument("--font-size", type=int, default=0,  help="Override font size (0=auto)")
    parser.add_argument("--margin-v",  type=int, default=0,  help="Override marginV in px (0=auto)")
    parser.add_argument("--frame-t",   type=float, default=1.0, help="Frame time for OCR (seconds)")
    parser.add_argument("--json-out",  default="",  help="Output detected region as JSON to this file")
    args = parser.parse_args()

    # 1. Get video dimensions
    try:
        vw, vh = get_video_dims(args.video)
    except Exception as e:
        print(f"[ERROR] Could not get video dims: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Video: {vw}x{vh}", file=sys.stderr)

    with tempfile.TemporaryDirectory() as tmp:
        frame_path = os.path.join(tmp, "frame.jpg")
        ass_path   = os.path.join(tmp, "subtitles.ass")

        # 2. Try multiple frame times to find one with subtitles
        region = None
        for t in [args.frame_t, 2.0, 3.0, 0.5]:
            if extract_frame(args.video, frame_path, t):
                region = detect_subtitle_region(frame_path, vh)
                if region:
                    break

        # 3. Calculate MarginV and font size
        if args.margin_v > 0:
            margin_v = args.margin_v
        elif region:
            # Place new subtitles just above the detected ones
            # marginV in ASS = distance from bottom of frame to bottom of text box
            # new_yBottom = region["yTop"] - 4
            new_y_bottom = region["yTop"] - 4
            margin_v = vh - new_y_bottom
            margin_v = max(10, margin_v)
        else:
            # Fallback: position at 72% of frame height (just above typical sub area)
            margin_v = int(vh * 0.28)

        if args.font_size > 0:
            font_size = args.font_size
        elif region:
            font_size = region["estimatedFontSize"]
        else:
            font_size = max(14, int(vh * 0.038))  # ~3.8% of video height

        print(f"[INFO] Using marginV={margin_v}, fontSize={font_size}", file=sys.stderr)

        # Output region JSON if requested
        if args.json_out:
            with open(args.json_out, "w") as jf:
                json.dump({
                    "region": region,
                    "margin_v": margin_v,
                    "font_size": font_size,
                    "video_w": vw,
                    "video_h": vh
                }, jf)

        # 4. Parse SRT
        entries = parse_srt(args.srt)
        if not entries:
            print("[ERROR] SRT file is empty or invalid", file=sys.stderr)
            sys.exit(1)

        print(f"[INFO] Parsed {len(entries)} subtitle entries", file=sys.stderr)

        # 5. Generate ASS file
        generate_ass(entries, vw, vh, margin_v, font_size, ass_path)

        # 6. Burn into video
        ok = inject_subtitles(args.video, ass_path, args.out)
        if not ok:
            sys.exit(1)

    print(f"[DONE] Output: {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
