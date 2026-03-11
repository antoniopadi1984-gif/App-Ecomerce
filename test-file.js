require('dotenv').config({ path: '.env' });

async function test() {
    try {
        const formData = new FormData();
        const buffer = Buffer.from("test");
        const file = new File([buffer], "audio.mp3", { type: "audio/mp3" });
        formData.append('file', file); 
        formData.append('model_id', 'scribe_v1'); 
        
        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
            body: formData,
        });
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
