import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time
import json
import shutil
import subprocess
from typing import Optional
from dotenv import load_dotenv
import google.generativeai as genai

# LOAD ENVIRONMENT AGGRESSIVELY
# Some libraries (google.generativeai) prioritize process-level env vars over manual configuration.
# We wipe them first to ensure .env is the only source of truth.
for k in ["GOOGLE_API_KEY", "GEMINI_API_KEY", "NEXT_PUBLIC_GEMINI_API_KEY"]:
    if k in os.environ:
        del os.environ[k]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(BASE_DIR, ".env")
print(f"🔍 [ENGINE] Wiping ghost keys and loading .env from: {env_path}")
load_dotenv(env_path, override=True)

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("NEXT_PUBLIC_GEMINI_API_KEY")

if GOOGLE_API_KEY:
    masked = GOOGLE_API_KEY[:6] + "..." + GOOGLE_API_KEY[-4:] if len(GOOGLE_API_KEY) > 10 else "***"
    print(f"✅ [ENGINE] Gemini Configured with Key: {masked}")
    # Force it into the environment for library compatibility
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    print(f"⚠️ [ENGINE] No valid Gemini Key found in {env_path}")

# Initialize FastAPI
app = FastAPI(
    title="Nano Banana Local Engine",
    description="Local Neural Engine for Video Generation & Avatars",
    version="0.5.5 (God Mode)"
)

# CORS Configuration (Allow Localhost Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CONSTANTS
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

class HealthCheck(BaseModel):
    status: str
    engine: str
    gpu_available: bool
    ffmpeg_available: bool

def is_ffmpeg_installed():
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except:
        return False

@app.get("/", response_model=HealthCheck)
async def health_check():
    """
    Heartbeat to check if the engine is running.
    """
    gpu_ok = False
    try:
        import torch
        if torch.backends.mps.is_available() or torch.cuda.is_available():
            gpu_ok = True
    except ImportError:
        pass

    return {
        "status": "operational",
        "engine": "Nano Banana Neural Bridge (God Mode)",
        "gpu_available": gpu_ok,
        "ffmpeg_available": is_ffmpeg_installed()
    }

@app.post("/generate-avatar")
async def generate_avatar(
    prompt: str = Form(...),
    style: str = Form("cinematic"),
    image: Optional[UploadFile] = File(None)
):
    # This feature requires R&D and GPU. Marking as 501 per Phase 0 audit.
    raise HTTPException(status_code=501, detail="Real-time Neural Avatar Synthesis not implemented yet. Feature Flag: AVATARS_LAB.SYNTHESIS_REAL is OFF.")

@app.post("/generate-simulation")
async def generate_simulation(
    mode: str = Form(...),
    subject_image: Optional[UploadFile] = File(None)
):
    # Simulation FX not implemented in v0.5.5 real bridge.
    raise HTTPException(status_code=501, detail="Biological Simulation FX not implemented.")

@app.post("/generate-interaction")
async def generate_interaction(
    product_name: str = Form(...),
    action: str = Form("holding"),
    subject_image: Optional[UploadFile] = File(None)
):
    # Interaction synthesis not implemented.
    raise HTTPException(status_code=501, detail="Product Interaction Synthesis not implemented.")

@app.post("/remove-metadata")
async def remove_metadata(video_file: UploadFile = File(...)):
    """
    Strips all metadata from the video file to prevent shadowbans.
    """
    input_path = os.path.join(UPLOAD_DIR, f"raw_{video_file.filename}")
    output_filename = f"clean_{int(time.time())}_{video_file.filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(video_file.file, buffer)
        
    print(f"[ENGINE] Stripping metadata from {video_file.filename}...")
    
    if is_ffmpeg_installed():
        try:
            subprocess.run([
                "ffmpeg", "-i", input_path, 
                "-map_metadata", "-1", 
                "-c:v", "copy", "-c:a", "copy", 
                output_path, "-y"
            ], check=True)
            
            return {
                "success": True,
                "message": "Metadata removed successfully (FFmpeg).",
                "output_url": f"/outputs/{output_filename}"
            }
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=422, detail=f"FFmpeg Execution Error: {str(e)}")
    else:
        raise HTTPException(status_code=422, detail="Critical: FFmpeg not found. Cannot remove metadata safely.")

@app.post("/render-frankenstein")
async def render_frankenstein(
    hook_file: UploadFile = File(...),
    body_file: UploadFile = File(...),
    cta_file: UploadFile = File(...)
):
    """
    Concatenates Hook + Body + CTA into a single video file.
    """
    hook_path = os.path.join(UPLOAD_DIR, f"hook_{int(time.time())}.mp4")
    body_path = os.path.join(UPLOAD_DIR, f"body_{int(time.time())}.mp4")
    cta_path = os.path.join(UPLOAD_DIR, f"cta_{int(time.time())}.mp4")
    
    with open(hook_path, "wb") as f: shutil.copyfileobj(hook_file.file, f)
    with open(body_path, "wb") as f: shutil.copyfileobj(body_file.file, f)
    with open(cta_path, "wb") as f: shutil.copyfileobj(cta_file.file, f)
        
    output_filename = f"frankenstein_{int(time.time())}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    print(f"[ENGINE] Stitching Frankenstein Video...")
    
    if is_ffmpeg_installed():
        try:
            # Complex filter for robust concatenation
            subprocess.run([
                "ffmpeg", 
                "-i", hook_path, 
                "-i", body_path, 
                "-i", cta_path,
                "-filter_complex", "[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[outv][outa]",
                "-map", "[outv]", "-map", "[outa]",
                output_path, "-y"
            ], check=True)
            
            return {
                "success": True,
                "message": "Frankenstein Video created successfully (FFmpeg).",
                "output_url": f"/outputs/{output_filename}"
            }
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"FFmpeg Stitch Error: {str(e)}")
    else:
        raise HTTPException(status_code=422, detail="Critical: FFmpeg not found. Cannot stitch videos safely.")

@app.post("/analyze-video")
async def analyze_video(video_file: UploadFile = File(...)):
    """
    Real Gemini Vision Analysis
    """
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=401, detail="Gemini API Key missing. Vision analysis unavailable.")

    input_path = os.path.join(UPLOAD_DIR, f"analyze_{video_file.filename}")
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(video_file.file, buffer)

    print(f"[ENGINE] Analyzing video with Gemini Vision: {video_file.filename}")

    try:
        # Upload to Gemini
        print("Uploading to Gemini File API...")
        video_file_gemini = genai.upload_file(path=input_path, display_name=video_file.filename)
        
        # Wait for processing
        while video_file_gemini.state.name == "PROCESSING":
            print('.', end='')
            time.sleep(1)
            video_file_gemini = genai.get_file(video_file_gemini.name)

        if video_file_gemini.state.name == "FAILED":
           raise ValueError(video_file_gemini.state.name)

        # Dynamic model selection
        try:
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            print(f"[ENGINE] Available Models: {available_models}")
            
            # Prefer 1.5-flash, then 1.5-pro, then anything else
            flash_models = [m for m in available_models if "1.5-flash" in m]
            if flash_models:
                target_model = flash_models[0]
            else:
                pro_models = [m for m in available_models if "1.5-pro" in m]
                target_model = pro_models[0] if pro_models else available_models[0]
        except Exception as list_err:
            print(f"[ENGINE] List models failed: {list_err}. Defaulting to gemini-1.5-flash")
            target_model = "models/gemini-1.5-flash"

        print(f"[ENGINE] Using model: {target_model}")
        model = genai.GenerativeModel(model_name=target_model)
        
        prompt = """
        Analyze this video content for e-commerce performance.
        Return a JSON object with:
        - hook_score (0-10)
        - pacing (Slow, Fast, Chaotic, Hypnotic)
        - emotional_triggers (List of emotions evoked: FOMO, Greed, Fear, etc.)
        - retention_audit (Where might people drop off?)
        - suggestion (One killer tip to improve it)
        """
        
        response = model.generate_content([video_file_gemini, prompt], request_options={"timeout": 600})
        
        # Parse JSON from response
        text = response.text.replace('```json', '').replace('```', '')
        analysis = json.loads(text)
        
        return {
            "success": True,
            "analysis": analysis
        }

    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"success": False, "error": str(e)}

def start():
    """Start the server"""
    print("🍌 Nano Banana Engine Starting on Port 8000...")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start()
