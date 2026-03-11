const url = "https://shopnovalift.com/?srsltid=AfmBOorJxz63PHaKCW5Hax63auD__DHbKeM45nXXLxVI5CmBcXaUqMH-&trafficSource=www.google.com";
const prompt = `Analiza la siguiente estructura y copy de esta Landing Page: URL: ${url}. 
        Estos son los títulos y textos extraídos: 
        """[test]"""
        
        Extrajimos 0 assets multimedia.
        
        Actúa como el mejor Marketer de Respuesta Directa del mundo. Evalúa cómo ataca los dolores, cómo presenta el mecanismo único, y detecta los puntos de fricción. En particular detecta cuántos y cuáles productos vende.
        
        Devuelve ABSOLUTAMENTE en formato JSON con la siguiente estructura y formato estricto:
        {
           "scores": {
               "hook": [Puntaje 0-100 para el gancho inicial (headline, primer scroll)],
               "mechanism": [Puntaje 0-100 para la explicación del mecanismo único y demostración],
               "offer": [Puntaje 0-100 para la claridad de la oferta y urgencia]
           },
           "productCount": [Número entero de productos distintos identificados],
           "productsFound": ["Nombre producto 1", "Nombre producto 2"],
           "structure": [
               "1. Hook / Headline: [De qué habla]",
               "2. Agitación / Problema: [De qué habla]",
               "3. Mecanismo Único: [De qué habla]",
               "4. Oferta: [De qué habla]"
           ],
           "criticalPoints": [
               "Punto de fricción 1...",
               "Punto de fricción 2..."
           ],
           "recommendations": [
               "Recomendación Pro 1...",
               "Recomendación Pro 2..."
           ]
        }`;

async function run() {
    const { AiRouter } = require('./src/lib/ai/router');
    const { TaskType } = require('./src/lib/ai/providers/interfaces');
    
    try {
        const res = await AiRouter.dispatch("GLOBAL", TaskType.RESEARCH_FORENSIC, prompt, { jsonSchema: true });
        console.log(res.text);
    } catch(e) {
        console.error("AI ROUTER ERROR:", e);
    }
}
run();
