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

# Absolute paths — Next.js/shell may not have /opt/homebrew/bin in PATH
FFPROBE = os.environ.get('FFPROBE_PATH', '/opt/homebrew/bin/ffprobe')
if not os.path.exists(FFPROBE):
    FFPROBE = 'ffprobe'  # fallback to PATH

FFMPEG_BIN = os.environ.get('FFMPEG_PATH', '/opt/homebrew/bin/ffmpeg')
if not os.path.exists(FFMPEG_BIN):
    FFMPEG_BIN = 'ffmpeg'


# ─────────────────────────────────────────────
# Frame extraction
# ─────────────────────────────────────────────

def extract_frame(video_path: str, out_path: str, t: float = 1.0) -> bool:
    """Extract a single frame at time t (seconds)."""
    result = subprocess.run(
        [FFMPEG_BIN, "-y", "-ss", str(t), "-i", video_path,
         "-vframes", "1", "-q:v", "2", out_path],
        capture_output=True
    )
    return result.returncode == 0 and os.path.exists(out_path)


# ─────────────────────────────────────────────
# Video dimensions
# ─────────────────────────────────────────────

def get_video_dims(video_path: str) -> tuple:
    """Returns (width, height) in pixels. Uses JSON output for reliability."""
    # Method 1: JSON via ffprobe (most reliable)
    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height",
             "-of", "json", video_path],
            capture_output=True, text=True, timeout=15
        )
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        if streams and streams[0].get("width") and streams[0].get("height"):
            return int(streams[0]["width"]), int(streams[0]["height"])
    except Exception:
        pass

    # Method 2: Use OpenCV directly as fallback (no ffprobe needed)
    try:
        cap = cv2.VideoCapture(video_path)
        if cap.isOpened():
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            if w > 0 and h > 0:
                print(f"[INFO] Dims via OpenCV: {w}x{h}", file=sys.stderr)
                return w, h
        cap.release()
    except Exception:
        pass

    raise RuntimeError(f"Could not determine video dimensions for: {video_path}")


# ─────────────────────────────────────────────
# Subtitle region detection
# ─────────────────────────────────────────────

def detect_subtitle_region(frame_path: str, video_h: int) -> Optional[dict]:
    """
    Detects the original subtitle bounding box using two strategies:
    1. Adaptive threshold + contour detection (dark text on any bg)
    2. Bright-region detection (white/light subtitle boxes common in TikTok)
    Returns { yTop, yBottom, xLeft, xRight, estimatedFontSize } or None.
    """
    img = cv2.imread(frame_path)
    if img is None:
        return None

    h, w = img.shape[:2]

    # Search in the bottom 65% of the frame (TikTok subs can be in mid-lower area)
    search_start = int(h * 0.35)
    roi = img[search_start:, :]
    roi_h, roi_w = roi.shape[:2]

    candidates = []

    # ── Strategy 1: Bright rectangular regions (white subtitle boxes) ──────────
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    # Threshold for bright/white areas (e.g. white TikTok sub boxes)
    _, bright_thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 3, 1))
    bright_dilated = cv2.dilate(bright_thresh, kernel_h, iterations=3)
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 8))
    bright_dilated = cv2.dilate(bright_dilated, kernel_v, iterations=2)
    contours_bright, _ = cv2.findContours(bright_dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours_bright:
        x, y, cw, ch = cv2.boundingRect(cnt)
        if cw < roi_w * 0.35: continue
        if ch < 10 or ch > 180: continue
        candidates.append((x, y + search_start, x + cw, y + ch + search_start, cw * ch + (y * 8)))

    # ── Strategy 2: Adaptive threshold (dark/outline text on any background) ───
    thresh_adapt = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY,
        blockSize=15, C=2
    )
    thresh_inv = cv2.bitwise_not(thresh_adapt)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (roi_w // 4, 5))
    for t in [thresh_adapt, thresh_inv]:
        dilated = cv2.dilate(t, kernel, iterations=2)
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            x, y, cw, ch = cv2.boundingRect(cnt)
            if cw < roi_w * 0.35: continue
            if ch < 10 or ch > 180: continue
            candidates.append((x, y + search_start, x + cw, y + ch + search_start, cw * ch + (y * 8)))

    if not candidates:
        print("[OCR] No subtitle region detected — using fallback position", file=sys.stderr)
        return None

    # Pick the candidate with the highest score (widest + lowest in frame)
    best = max(candidates, key=lambda c: c[4])
    xL, yT, xR, yB, _ = best
    font_size = max(14, min(60, int((yB - yT) * 0.80)))

    print(f"[OCR] ✅ Subtitle region: y={yT}–{yB} x={xL}–{xR} (h={yB-yT}px) fontSize≈{font_size}", file=sys.stderr)
    return {
        "yTop":              yT,
        "yBottom":           yB,
        "xLeft":             xL,
        "xRight":            xR,
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
        raw_text = " ".join(lines[2:]).replace("\n", " ")
        # Wrap to max 5 words per line so the box doesn't span the full width
        words = raw_text.split()
        MAX_WORDS = 5
        if len(words) > MAX_WORDS:
            mid = (len(words) + 1) // 2
            text = " ".join(words[:mid]) + "\\N" + " ".join(words[mid:])
        else:
            text = raw_text
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
    # ─────────────────────────────────────────────────────────
    # ASS colour format: &HAABBGGRR  (AA=alpha 00=opaque FF=transparent)
    # &H00000000 = opaque black text
    # &H00FFFFFF = opaque white box background (SOLID, no transparency)
    # BorderStyle=4 = opaque box behind text (no outline/shadow mode)
    # ScaleX=110 → 10% wider box for more breathing room
    # Spacing=1.5 → slight letter spacing for legibility
    # ─────────────────────────────────────────────────────────

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {video_w}
PlayResY: {video_h}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Arial,{font_size},&H00000000,&H000000FF,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,4,2,0,2,20,20,{margin_v},1

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

def inject_subtitles(video_path: str, ass_path: str, out_path: str,
                     blur_region: Optional[dict] = None) -> bool:
    """Burn ASS subtitles using FFmpeg libass. Optionally blurs the original subtitle region."""

    if blur_region:
        # Build a filter_complex that:
        # 1. Blurs the detected region (original subs)
        # 2. Burns the new ASS subs on top
        x  = max(0, blur_region['xLeft'])
        y  = max(0, blur_region['yTop'])
        bw = max(1, blur_region['xRight'] - blur_region['xLeft'])
        bh = max(1, blur_region['yBottom'] - blur_region['yTop'])

        # Pad blur height slightly to make sure we cover the full original sub area
        y_padded = max(0, y - 4)
        bh_padded = bh + 8

        filter_complex = (
            f"[0:v]split[main][blur_in];"
            f"[blur_in]crop={bw}:{bh_padded}:{x}:{y_padded},"
            f"boxblur=luma_radius=18:luma_power=4:chroma_radius=18:chroma_power=4[blurred];"
            f"[main][blurred]overlay={x}:{y_padded}[blurred_v];"
            f"[blurred_v]ass={ass_path}"
        )
        cmd = [
            FFMPEG_BIN, "-y",
            "-i", video_path,
            "-filter_complex", filter_complex,
            "-c:v", "libx264", "-crf", "18", "-preset", "fast",
            "-c:a", "copy",
            out_path
        ]
        print(f"[FFmpeg] Blur region: x={x} y={y_padded} w={bw} h={bh_padded}px", file=sys.stderr)
    else:
        cmd = [
            FFMPEG_BIN, "-y",
            "-i", video_path,
            "-vf", f"ass={ass_path}",
            "-c:v", "libx264", "-crf", "18", "-preset", "fast",
            "-c:a", "copy",
            out_path
        ]

    print(f"[FFmpeg] Running injection...", file=sys.stderr)
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

        # Try multiple frame times spread across the video to find one with subtitles
        region = None
        for t in [1.0, 5.0, 10.0, 20.0, 30.0, 2.0]:
            if extract_frame(args.video, frame_path, t):
                region = detect_subtitle_region(frame_path, vh)
                if region:
                    break

        # 3. Calculate MarginV and font size
        if args.margin_v > 0:
            margin_v = args.margin_v
        elif region:
            # Place new subs IN the detected original subtitle zone
            # margin_v = distance from bottom of frame to bottom of the region
            margin_v = vh - region["yBottom"]
            margin_v = max(5, margin_v)
        else:
            # Fallback: standard bottom position (10% from bottom)
            margin_v = int(vh * 0.10)

        if args.font_size > 0:
            font_size = args.font_size
        elif region:
            font_size = max(18, region["estimatedFontSize"])
        else:
            font_size = max(18, int(vh * 0.035))  # 3.5% of video height


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

        # 6. Burn into video (with blur on original sub region if detected)
        ok = inject_subtitles(args.video, ass_path, args.out, blur_region=region)
        if not ok:
            sys.exit(1)

    print(f"[DONE] Output: {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
