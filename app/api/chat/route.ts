
// El Camino - SIMPLE como la primera versión que funcionaba ayer
// Solo Groq, sin APIs externas, sin BibleBoard, sin bolls, sin nada más
export async function POST(req: Request){
  let messages: any[] = [];
  try{ const body = await req.json(); messages = body.messages || []; }catch(e){ return Response.json({error:'JSON invalido'}, {status:400}); }
  const apiKey = process.env.GROQ_API_KEY;
  if(!apiKey) return Response.json({error:'Falta GROQ_API_KEY en Vercel'}, {status:500});

  const PROMPT = `Eres El Camino, asistente bíblico de www.elcaminojuan146.lat - Juan 14:6 "Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí."
Usa Reina-Valera 1960 como base, con "Jehová" no "Señor". Puedes citar versículos, capítulos, dar estudios, oraciones, comparaciones de versiones, y explicar la Biblia.
Reglas: Si te piden un capítulo completo, dalo completo versículo por versículo, sin resumir. No repitas la misma frase. Salmo 23 tiene 6 versículos. Salmo 34 tiene 22 versículos. Salmo 118 tiene 29 versículos. Responde en español, cálido, claro.`;

  // Solo 1 modelo estable, como la primera versión que funcionaba
  try{
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{role:'system', content:PROMPT}, ...messages.map((m:any)=>({role:m.role, content:m.content}))],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });
    const data = await res.json();
    if(!res.ok) return Response.json({error: data?.error?.message || 'Error Groq'}, {status:500});
    const text = data?.choices?.[0]?.message?.content || 'No pude responder, intenta de nuevo.';
    return Response.json({message: text});
  }catch(e:any){
    return Response.json({error: e.message}, {status:500});
  }
}
