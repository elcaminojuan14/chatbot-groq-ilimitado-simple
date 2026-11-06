
// El Camino v3.5 - Biblia REAL via bible-api.com + Groq para estudios
// Ya NO deja que el modelo invente versiculos

function parseBibleRef(text: string){
  // Detecta: Salmo 34, Salmos 34, Juan 14, Genesis 1, 1 Juan 2:3, etc
  const lower = text.toLowerCase();
  // Patrones comunes
  const patterns = [
    /(salmo|salmos)\s*(\d+)(?::(\d+))?/i,
    /(juan)\s*(\d+)(?::(\d+))?/i,
    /(genesis|exodo|levitico|numeros|mateo|marcos|lucas|hechos|romanos|apocalipsis)\s*(\d+)(?::(\d+))?/i,
  ];
  for(const p of patterns){
    const m = text.match(p);
    if(m){
      // Normalizar nombre para bible-api.com
      let book = m[1].toLowerCase();
      if(book==='salmo'||book==='salmos') book='Psalms';
      if(book==='juan') book='John';
      if(book==='genesis') book='Genesis';
      if(book==='mateo') book='Matthew';
      if(book==='marcos') book='Mark';
      if(book==='lucas') book='Luke';
      if(book==='hechos') book='Acts';
      if(book==='romanos') book='Romans';
      if(book==='apocalipsis') book='Revelation';
      if(book==='exodo') book='Exodus';
      const chapter = m[2];
      const verse = m[3];
      return {book, chapter, verse, raw: m[0]};
    }
  }
  return null;
}

async function fetchRealBible(book: string, chapter: string, verse?: string, translation: string = 'rvr'){
  // bible-api.com es gratis, sin key, texto REAL
  // Ej: https://bible-api.com/Psalms+34?translation=rvr
  // Ej: https://bible-api.com/John+14:6?translation=rvr
  let query = `${book}+${chapter}`;
  if(verse) query += `:${verse}`;
  // Intentar con RVR - bible-api usa 'rvr' o 'spa-rvr' segun version
  const urls = [
    `https://bible-api.com/${encodeURIComponent(query)}?translation=rvr`,
    `https://bible-api.com/${encodeURIComponent(query)}?translation=spa-rvr`,
    `https://bible-api.com/${encodeURIComponent(query)}?translation=kjv`,
  ];
  for(const url of urls){
    try{
      const res = await fetch(url);
      if(!res.ok) continue;
      const data = await res.json();
      if(data && data.text){
        return {text: data.text, reference: data.reference, translation: data.translation_name || translation, verses: data.verses};
      }
    }catch(e){ continue; }
  }
  return null;
}

export async function POST(req: Request){
  let messages: any[] = [];
  try{
    const body = await req.json();
    messages = body.messages || [];
  }catch(e:any){
    return Response.json({error: 'JSON invalido'}, {status:400});
  }

  const lastUserMsg = [...messages].reverse().find((m:any)=>m.role==='user')?.content || '';
  const lowerMsg = lastUserMsg.toLowerCase();

  const wantsChapter = lowerMsg.includes('salmo') || lowerMsg.includes('completo') || lowerMsg.includes('capitulo') || lowerMsg.includes('juan 14') || lowerMsg.includes('genesis');
  const ref = parseBibleRef(lastUserMsg);

  // 1) Si pide capitulo/versiculo especifico, traer de API REAL primero
  if(ref && (wantsChapter || lastUserMsg.includes(':') || lowerMsg.includes('salmo'))){
    const real = await fetchRealBible(ref.book, ref.chapter, ref.verse);
    if(real && real.text){
      // Formatear bonito con versiculos numerados si viene en verses
      let formatted = `**${real.reference} RVR 1960**\n\n`;
      if(real.verses && Array.isArray(real.verses)){
        real.verses.forEach((v:any)=>{
          formatted += `${v.verse} ${v.text.trim()}\n`;
        });
      } else {
        formatted += real.text;
      }
      formatted += `\n\n*(Texto REAL de bible-api.com / bible.com / biblegateway.com, versión Reina-Valera 1960. No inventado por IA.)*`;
      return Response.json({message: formatted});
    }
  }

  // 2) Si no es capitulo especifico, usar Groq para estudios/oraciones pero con instruccion de NO inventar versiculos
  const apiKey = process.env.GROQ_API_KEY;
  if(!apiKey){
    return Response.json({error: 'Falta GROQ_API_KEY en Vercel'}, {status:500});
  }

  const PROMPT = `Eres El Camino, asistente biblico de www.elcaminojuan146.lat - Juan 14:6. Color #387b5b.
REGLA CRITICA: NUNCA inventes versiculos. Si no sabes el texto exacto de un versiculo, di: "Verifica en bible.com o biblegateway.com" y NO inventes.
Si te piden estudio, oracion o explicacion, puedes usar Groq, pero los versiculos exactos DEBEN venir de bible-api.com.
Si te piden capitulo completo, responde que lo estas buscando en la API real.
Siempre cita RVR 1960. Usa Jehova, no Senor, en RVR 1960.
Fuentes: bible.com y biblegateway.com.`;

  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b', 'llama3-8b-8192'];

  for(const model of models){
    try{
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body: JSON.stringify({
          model: model,
          messages: [{role:'system', content: PROMPT}, ...messages.map((m:any)=>({role:m.role, content:m.content}))],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      });
      const data = await res.json();
      if(!res.ok) continue;
      const text = data?.choices?.[0]?.message?.content;
      if(text) return Response.json({message: text});
    }catch(e){ continue; }
  }

  return Response.json({error: 'No se pudo generar respuesta. Verifica GROQ_API_KEY.'}, {status:500});
}
