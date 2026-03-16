export const REPLICATE_MODELS = {
  WHISPER_FAST:        { id: "vaibhavs10/incredibly-fast-whisper", use: "transcription", quality: "fast" },
  WHISPER_DIARIZE:     { id: "thomasmol/whisper-diarization", use: "transcription_speakers" },
  LIPSYNC_FABRIC:      { id: "veed/fabric-1.0", use: "lipsync", quality: "production" },
  LIPSYNC_LATENTSYNC:  { id: "bytedance/latentsync", use: "lipsync", quality: "fast" },
  LIPSYNC_SADTALKER:   { id: "cjwbw/sadtalker", use: "avatar_from_image" },
  AVATAR_HEYGEN:       { id: "heygen/avatar-iv", use: "avatar_premium" },
  VIDEO_AGENT_HEYGEN:  { id: "heygen/video-agent", use: "full_video_from_script" },
  LIVE_PORTRAIT:       { id: "fofr/live-portrait", use: "animate_photo" },
  VIDEO_KLING_V3:      { id: "kwaivgi/kling-v3-video", use: "t2v|i2v", quality: "cinema" },
  VIDEO_KLING_MOTION:  { id: "kwaivgi/kling-v3-motion-control", use: "motion_transfer" },
  VIDEO_WAN_I2V:       { id: "wan-video/wan-2.5-i2v-fast", use: "i2v", quality: "production" },
  VIDEO_RUNWAY:        { id: "runwayml/gen-4.5", use: "t2v|i2v" },
  VIDEO_LTX_PRO:       { id: "lightricks/ltx-2.3-pro", use: "t2v|i2v", quality: "ultra" },
  VIDEO_LTX_FAST:      { id: "lightricks/ltx-2.3-fast", use: "t2v|i2v", quality: "draft" },
  VIDEO_VEO_FAST:      { id: "google/veo-3.1-fast", use: "t2v|i2v" },
  VIDEO_GROK:          { id: "xai/grok-imagine-video", use: "t2v|i2v", quality: "fast" },
  VIDEO_MINIMAX:       { id: "minimax/video-01", use: "t2v" },
  VIDEO_VIDU_PRO:      { id: "vidu/q3-pro", use: "t2v|i2v" },
  VIDEO_P_VIDEO:       { id: "prunaai/p-video", use: "t2v|i2v|s2v", quality: "draft" },
  VIDEO_REFRAME:       { id: "luma/reframe-video", use: "reframe" },
  VIDEO_MODIFY:        { id: "luma/modify-video", use: "video_edit" },
  IMAGE_FLUX_2_PRO:    { id: "black-forest-labs/flux-2-pro", use: "image_gen", quality: "premium" },
  IMAGE_FLUX_2_DEV:    { id: "black-forest-labs/flux-2-dev", use: "image_gen" },
  IMAGE_FLUX_2_FAST:   { id: "black-forest-labs/flux-2-klein-4b", use: "image_gen", quality: "fast" },
  IMAGE_FLUX_KONTEXT:  { id: "black-forest-labs/flux-kontext-pro", use: "image_edit|image_from_face" },
  IMAGE_NANO_2:        { id: "google/nano-banana-2", use: "image_gen|image_edit" },
  IMAGE_NANO_PRO:      { id: "google/nano-banana-pro", use: "image_gen|packaging|branding", quality: "ultra" },
  IMAGE_RECRAFT_V4:    { id: "recraft-ai/recraft-v4", use: "image_gen|design" },
  IMAGE_RECRAFT_PRO:   { id: "recraft-ai/recraft-v4-pro", use: "image_gen|design|packaging", quality: "premium" },
  IMAGE_RECRAFT_SVG:   { id: "recraft-ai/recraft-v4-svg", use: "logo|icon|svg" },
  IMAGE_RECRAFT_SVG_PRO: { id: "recraft-ai/recraft-v4-pro-svg", use: "logo|packaging|branding" },
  IMAGE_SEEDREAM:      { id: "bytedance/seedream-5-lite", use: "image_gen|image_edit" },
  IMAGE_GPT:           { id: "openai/gpt-image-1.5", use: "image_gen|image_edit" },
  IMAGE_RUNWAY_GEN4:   { id: "runwayml/gen4-image", use: "image_from_face|consistent_character" },
  IMAGE_EDIT_FAST:     { id: "prunaai/p-image-edit", use: "image_edit", quality: "ultra_fast" },
  IMAGE_REMOVE_BG:     { id: "lucataco/remove-bg", use: "remove_bg" },
  TTS_INWORLD_MAX:     { id: "inworld/tts-1.5-max", use: "tts", quality: "premium" },
  TTS_MINIMAX:         { id: "minimax/speech-2.8-turbo", use: "tts" },
  TTS_CHATTERBOX:      { id: "resemble-ai/chatterbox-turbo", use: "tts|voice_clone" },
  VOICE_CLONE_RVC:     { id: "zsxkib/realistic-voice-cloning", use: "voice_clone" },
  AUDIO_SEPARATOR:     { id: "ryan5453/demucs", use: "audio_separate" },
  AUDIO_SFX:           { id: "zsxkib/mmaudio", use: "add_sfx" },
  MUSIC_ELEVENLABS:    { id: "elevenlabs/music", use: "music_gen" },
  MUSIC_MINIMAX:       { id: "minimax/music-2.5", use: "music_gen" },
  SUBTITLES_AUTO:      { id: "fictions-ai/autocaption", use: "subtitles" },
  VIDEO_UPSCALE:       { id: "topazlabs/video-upscale", use: "upscale_video" },

  // ── NUEVOS MODELOS VERIFICADOS MARZO 2026 ─────────────────────
  
  // Traducción de vídeo completa (HeyGen)
  VIDEO_TRANSLATE:     { id: "heygen/video-translation", use: "video_translate", quality: "production" },
  
  // Avatar full-body con audio (mejor que sadtalker)
  OMNI_HUMAN:          { id: "bytedance/omni-human-1.5", use: "avatar_fullbody", quality: "production" },
  DREAMACTOR:          { id: "bytedance/dreamactor-m2.0", use: "animate_character", quality: "production" },
  
  // Kling Avatar
  KLING_AVATAR:        { id: "kwaivgi/kling-v2-avatar", use: "avatar_premium", quality: "production" },
  
  // Vídeo con audio sincronizado (los mejores)
  VIDEO_VEO3:          { id: "google/veo-3", use: "t2v", quality: "ultra" },
  VIDEO_VEO3_FAST:     { id: "google/veo-3-fast", use: "t2v", quality: "production" },
  VIDEO_SEEDANCE_PRO:  { id: "bytedance/seedance-1-pro", use: "t2v|i2v", quality: "production" },
  VIDEO_SORA2:         { id: "openai/sora-2", use: "t2v|i2v", quality: "ultra" },
  VIDEO_PIXVERSE_V5:   { id: "pixverse/pixverse-v5", use: "t2v|i2v", quality: "fast" },
  
  // Imágenes de producto (especializado)
  IMAGE_BRIA_PRODUCT:  { id: "bria/product-image", use: "product_image", quality: "production" },
  IMAGE_BRIA_BG_GEN:   { id: "bria/background-generation", use: "background_gen", quality: "production" },
  IMAGE_BRIA_REMOVE_BG: { id: "bria/remove-background", use: "remove_bg", quality: "production" },
  IMAGE_BRIA_GENFILL:  { id: "bria/genfill", use: "image_fill", quality: "production" },
  IMAGE_BRIA_ERASE:    { id: "bria/eraser", use: "image_erase", quality: "production" },
  
  // Upscale imágenes (Recraft y Topaz)
  IMAGE_UPSCALE_CRISP: { id: "recraft-ai/recraft-crisp-upscale", use: "upscale_image", quality: "production" },
  IMAGE_UPSCALE_CREATIVE: { id: "recraft-ai/recraft-creative-upscale", use: "upscale_image_creative", quality: "premium" },
  IMAGE_VECTORIZE:     { id: "recraft-ai/recraft-vectorize", use: "vectorize", quality: "production" },
  
  // Flux 2 Flex (hasta 10 imágenes de referencia — ideal para consistencia de personaje)
  IMAGE_FLUX_2_FLEX:   { id: "black-forest-labs/flux-2-flex", use: "image_gen|consistent_character", quality: "premium" },
  
  // Ideogram v3 (mejor texto en imágenes)
  IMAGE_IDEOGRAM_V3:   { id: "ideogram-ai/ideogram-v3-quality", use: "image_gen|text_in_image", quality: "premium" },
  
  // Vídeo sincronizado (Pixverse lipsync)
  LIPSYNC_PIXVERSE:    { id: "pixverse/lipsync", use: "lipsync", quality: "fast" },
  LIPSYNC_KLING:       { id: "kwaivgi/kling-lip-sync", use: "lipsync", quality: "production" },
  
  // Audio a vídeo (LTX)
  VIDEO_AUDIO_TO_VIDEO: { id: "lightricks/audio-to-video", use: "audio_to_video", quality: "production" },
  
  // Transcripción GPT-4o (mejor que Whisper para español)
  TRANSCRIBE_GPT4O:    { id: "openai/gpt-4o-transcribe", use: "transcription", quality: "premium" },
  
  // Efectos de sonido para vídeo
  VIDEO_SFX:           { id: "mirelo/video-to-sfx-v1.5", use: "add_sfx_auto", quality: "production" },
  
  // 3D desde imagen
  MODEL_3D:            { id: "hyper3d/rodin", use: "3d_from_image", quality: "production" },

} as const;

export type ReplicateModelKey = keyof typeof REPLICATE_MODELS;

export function selectModel(
  task: "lipsync"|"i2v"|"t2v"|"avatar"|"full_video"|"image"|"image_edit"|"logo"|"packaging"|"tts"|"music"|"subtitles"|"remove_bg"|"upscale",
  quality: "draft"|"fast"|"production"|"ultra" = "production"
): (typeof REPLICATE_MODELS)[ReplicateModelKey] | null {
  const map: Record<string, Record<string, ReplicateModelKey>> = {
    lipsync:    { draft:"LIPSYNC_LATENTSYNC", fast:"LIPSYNC_LATENTSYNC", production:"LIPSYNC_FABRIC", ultra:"LIPSYNC_FABRIC" },
    i2v:        { draft:"VIDEO_P_VIDEO", fast:"VIDEO_GROK", production:"VIDEO_WAN_I2V", ultra:"VIDEO_LTX_PRO" },
    t2v:        { draft:"VIDEO_P_VIDEO", fast:"VIDEO_GROK", production:"VIDEO_KLING_V3", ultra:"VIDEO_LTX_PRO" },
    avatar:     { draft:"LIPSYNC_SADTALKER", fast:"LIPSYNC_SADTALKER", production:"AVATAR_HEYGEN", ultra:"AVATAR_HEYGEN" },
    full_video: { draft:"VIDEO_AGENT_HEYGEN", fast:"VIDEO_AGENT_HEYGEN", production:"VIDEO_AGENT_HEYGEN", ultra:"VIDEO_AGENT_HEYGEN" },
    image:      { draft:"IMAGE_FLUX_2_FAST", fast:"IMAGE_FLUX_2_DEV", production:"IMAGE_FLUX_2_PRO", ultra:"IMAGE_NANO_PRO" },
    image_edit: { draft:"IMAGE_EDIT_FAST", fast:"IMAGE_EDIT_FAST", production:"IMAGE_FLUX_KONTEXT", ultra:"IMAGE_NANO_2" },
    logo:       { draft:"IMAGE_RECRAFT_SVG", fast:"IMAGE_RECRAFT_SVG", production:"IMAGE_RECRAFT_SVG_PRO", ultra:"IMAGE_RECRAFT_SVG_PRO" },
    packaging:  { draft:"IMAGE_RECRAFT_V4", fast:"IMAGE_RECRAFT_V4", production:"IMAGE_RECRAFT_PRO", ultra:"IMAGE_NANO_PRO" },
    tts:        { draft:"TTS_CHATTERBOX", fast:"TTS_MINIMAX", production:"TTS_INWORLD_MAX", ultra:"TTS_INWORLD_MAX" },
    music:      { draft:"MUSIC_ELEVENLABS", fast:"MUSIC_ELEVENLABS", production:"MUSIC_MINIMAX", ultra:"MUSIC_MINIMAX" },
    subtitles:  { draft:"SUBTITLES_AUTO", fast:"SUBTITLES_AUTO", production:"SUBTITLES_AUTO", ultra:"SUBTITLES_AUTO" },
    remove_bg:  { draft:"IMAGE_REMOVE_BG", fast:"IMAGE_REMOVE_BG", production:"IMAGE_REMOVE_BG", ultra:"IMAGE_REMOVE_BG" },
    upscale:    { draft:"VIDEO_UPSCALE", fast:"VIDEO_UPSCALE", production:"VIDEO_UPSCALE", ultra:"VIDEO_UPSCALE" },
  };
  const key = map[task]?.[quality] ?? map[task]?.["production"];
  return key ? REPLICATE_MODELS[key] : null;
}
