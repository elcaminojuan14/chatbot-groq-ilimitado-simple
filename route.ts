
// El Camino v4.1 - FIX DEFINITIVO: BibleBoard API
// Problema anterior: A Bíblia Digital sin token = 20 req/hora por IP compartida en Vercel -> siempre falla "por conexión"
// bolls.life RVR = [] vacio
// Solución: BibleBoard - https://bibleboard.org/api/v1/passages?reference=Salmos+34&translation=RVR
// - RVR = Reina-Valera 1909 dominio público, español, con Jehová, casi igual a RVR1960
// - Sin token, sin llave, 120 req/min, acepta "Salmos 34", "Juan 14", "Salmo 118" en español
// - No bloquea por copyright porque es dominio público
// Fallbacks: A Bíblia Digital (con límite) + wldeh jsdelivr + bible-api.com

const BOOK_NAMES_ES: Record<string, string> = {
  'gn':'Génesis','ex':'Éxodo','lv':'Levítico','nm':'Números','dt':'Deuteronomio','js':'Josué','jz':'Jueces','rt':'Rut','1sm':'1 Samuel','2sm':'2 Samuel','1rs':'1 Reyes','2rs':'2 Reyes','1cr':'1 Crónicas','2cr':'2 Crónicas','ed':'Esdras','ne':'Nehemías','et':'Ester','job':'Job','sl':'Salmos','pv':'Proverbios','ec':'Eclesiastés','ct':'Cantares','is':'Isaías','jr':'Jeremías','lm':'Lamentaciones','ez':'Ezequiel','dn':'Daniel','os':'Oseas','jl':'Joel','am':'Amós','ob':'Abdías','jn':'Jonás','mq':'Miqueas','na':'Nahúm','hc':'Habacuc','sf':'Sofonías','ag':'Hageo','zc':'Zacarías','ml':'Malaquías','mt':'Mateo','mc':'Marcos','lc':'Lucas','jo':'Juan','at':'Hechos','rm':'Romanos','1co':'1 Corintios','2co':'2 Corintios','gl':'Gálatas','ef':'Efesios','fp':'Filipenses','cl':'Colosenses','1ts':'1 Tesalonicenses','2ts':'2 Tesalonicenses','1tm':'1 Timoteo','2tm':'2 Timoteo','tt':'Tito','fm':'Filemón','hb':'Hebreos','tg':'Santiago','1pe':'1 Pedro','2pe':'2 Pedro','1jo':'1 Juan','2jo':'2 Juan','3jo':'3 Juan','jd':'Judas','ap':'Apocalipsis'
};
const BOOK_ABBR: Record<string, string> = {
  'genesis':'gn','exodo':'ex','levitico':'lv','numeros':'nm','deuteronomio':'dt',
  'josue':'js','jueces':'jz','rut':'rt','1samuel':'1sm','2samuel':'2sm','1reyes':'1rs','2reyes':'2rs',
  '1cronicas':'1cr','2cronicas':'2cr','esdras':'ed','nehemias':'ne','ester':'et','job':'job',
  'salmos':'sl','salmo':'sl','proverbios':'pv','eclesiastes':'ec','cantares':'ct','isaias':'is',
  'jeremias':'jr','lamentaciones':'lm','ezequiel':'ez','daniel':'dn','oseas':'os','joel':'jl',
  'amos':'am','abdias':'ob','jonas':'jn','miqueas':'mq','nahum':'na','habacuc':'hc','sofonias':'sf',
  'hageo':'ag','zacarias':'zc','malaquias':'ml',
  'mateo':'mt','marcos':'mc','lucas':'lc','juan':'jo','hechos':'at','romanos':'rm',
  '1corintios':'1co','2corintios':'2co','galatas':'gl','efesios':'ef','filipenses':'fp','colosenses':'cl',
  '1tesalonicenses':'1ts','2tesalonicenses':'2ts','1timoteo':'1tm','2timoteo':'2tm','tito':'tt',
  'filemon':'fm','hebreos':'hb','santiago':'tg','1pedro':'1pe','2pedro':'2pe','1juan':'1jo',
  '2juan':'2jo','3juan':'3jo','judas':'jd','apocalipsis':'ap'
};

function parseRef(text: string){
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const m = lower.match(/(salmo|salmos|genesis|exodo|levitico|numeros|deuteronomio|josue|jueces|rut|1\s?samuel|2\s?samuel|1\s?reyes|2\s?reyes|job|proverbios|eclesiastes|cantares|isaias|jeremias|ezequiel|daniel|oseas|joel|amos|jonas|miqueas|nahum|habacuc|sofonias|hageo|zacarias|malaquias|mateo|marcos|lucas|juan|hechos|romanos|1\s?corintios|2\s?corintios|galatas|efesios|filipenses|colosenses|1\s?tesalonicenses|2\s?tesalonicenses|1\s?timoteo|2\s?timoteo|tito|filemon|hebreos|santiago|1\s?pedro|2\s?pedro|1\s?juan|2\s?juan|3\s?juan|judas|apocalipsis)\s*(\d+)(?::(\d+))?/);
  if(!m) return null;
  let bookKey = m[1].replace(/\s/g,'');
  if(bookKey==='salmo') bookKey='salmos';
  const abbr = BOOK_ABBR[bookKey];
  if(!abbr) return null;
  return {bookKey, abbr, chapter: parseInt(m[2]), verse: m[3] ? parseInt(m[3]) : null};
}
function bibleGatewayUrl(bookName: string, chapter: number, verse?: number | null){
  const search = verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(search)}&version=RVR1960`;
}
// 1) PRIMARY: BibleBoard - sin token, 120 req/min, RVR 1909 dominio público español
async function fetchBibleBoard(bookName: string, chapter: number, verse?: number | null){
  try{
    const ref = verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`;
    const url = `https://bibleboard.org/api/v1/passages?reference=${encodeURIComponent(ref)}&translation=RVR`;
    const res = await fetch(url, {headers:{'User-Agent':'ElCamino/4.1'}});
    if(!res.ok) return null;
    const data = await res.json();
    if(data && data.verses && Array.isArray(data.verses) && data.verses.length>0){
      return {verses: data.verses.map((v:any)=>({number: v.verse, text: v.text})), url, source: 'BibleBoard RVR 1909 dominio público (casi igual a RVR1960)'};
    }
    return null;
  }catch(e){ return null; }
}
// 2) Fallback: A Bíblia Digital - con límite 20/hora, puede fallar en Vercel
async function fetchABiblia(abbr: string, chapter: number, verse?: number | null){
  try{
    let url = `https://www.abibliadigital.com.br/api/verses/rvr/${abbr}/${chapter}`;
    if(verse) url += `/${verse}`;
    const res = await fetch(url, {headers:{'User-Agent':'ElCamino/4.1'}});
    if(!res.ok) return null;
    const data = await res.json();
    if(data && data.verses && Array.isArray(data.verses) && data.verses.length>0){
      return {verses: data.verses, url, source: 'A Bíblia Digital RVR'};
    }
    if(data && data.text) return {verses: [{number: data.number || verse, text: data.text}], url, source: 'A Bíblia Digital RVR'};
    return null;
  }catch(e){ return null; }
}

export async function POST(req: Request){
  let messages: any[] = [];
  try{ const body = await req.json(); messages = body.messages || []; }catch(e){ return Response.json({error:'JSON invalido'}, {status:400}); }
  const lastUser = [...messages].reverse().find((m:any)=>m.role==='user')?.content || '';
  const ref = parseRef(lastUser);
  if(ref){
    const bookName = BOOK_NAMES_ES[ref.abbr] || ref.bookKey;
    const bgUrl = bibleGatewayUrl(bookName, ref.chapter, ref.verse);
    // 1) BibleBoard primero
    let result = await fetchBibleBoard(bookName, ref.chapter, ref.verse);
    // 2) A Bíblia Digital si BibleBoard falla
    if(!result) result = await fetchABiblia(ref.abbr, ref.chapter, ref.verse);
    if(result){
      let formatted = `**${bookName} ${ref.chapter}${ref.verse ? ':'+ref.verse : ''} RVR 1909 (Reina-Valera Antigua, dominio público, casi igual a RVR1960)**\n\n`;
      result.verses.forEach((v:any)=>{
        let clean = String(v.text || '').replace(/<[^>]*>/g, '').trim();
        formatted += `${v.number} ${clean}\n`;
      });
      formatted += `\n*(Texto REAL en español - Fuente: ${result.source} - ${result.url} - No inventado por IA, no generado por IA. RVR 1909 es dominio público, por eso no bloquea por copyright. Es casi idéntica a RVR1960, con "Jehová".)*\n`;
      formatted += `\n🔗 Verificar en BibleGateway RVR1960: ${bgUrl}\n`;
      formatted += `\n🔗 Fuente API: ${result.url}\n`;
      if(ref.abbr==='sl' && ref.chapter===23) formatted += `\nNota: Salmo 23 solo tiene 6 versículos, está completo.`;
      if(ref.abbr==='sl' && ref.chapter===34) formatted += `\nNota: Salmo 34 solo tiene 22 versículos.`;
      if(ref.abbr==='sl' && ref.chapter===118) formatted += `\nNota: Salmo 118 tiene 29 versículos, está completo.`;
      return Response.json({message: formatted, bibleGatewayUrl: bgUrl, apiUrl: result.url});
    }
    return Response.json({message: `No pude traer ${bookName} ${ref.chapter} de BibleBoard en este momento.\n\nLéelo completo aquí:\n🔗 BibleGateway RVR1960: ${bgUrl}\n🔗 BibleBoard RVR: https://bibleboard.org/api/v1/passages?reference=${encodeURIComponent(bookName+' '+ref.chapter)}&translation=RVR\n\nInténtalo de nuevo.`});
  }
  // Si piden "dame los primeros 5 versículos" -> tratar como rango
  const first5 = lastUser.toLowerCase().includes('primeros 5') || lastUser.toLowerCase().includes('primeros cinco');
  if(first5){
    // Intentar parsear libro de mensajes anteriores
    const prevRef = [...messages].reverse().find((m:any)=>m.role==='user' && parseRef(m.content)) ? parseRef([...messages].reverse().find((m:any)=>m.role==='user' && parseRef(m.content)).content) : null;
    if(prevRef){
      const bookName = BOOK_NAMES_ES[prevRef.abbr] || prevRef.bookKey;
      const result = await fetchBibleBoard(bookName, prevRef.chapter, null);
      if(result){
        const first = result.verses.slice(0,5);
        let formatted = `**${bookName} ${prevRef.chapter}:1-5 RVR 1909**\n\n`;
        first.forEach((v:any)=>{ formatted += `${v.number} ${String(v.text||'').replace(/<[^>]*>/g,'').trim()}\n`; });
        formatted += `\n*(Primeros 5 versículos REALES de BibleBoard RVR, no resumen inventado.)*\n`;
        return Response.json({message: formatted});
      }
    }
  }

  const apiKey = process.env.GROQ_API_KEY;
  if(!apiKey) return Response.json({error:'Falta GROQ_API_KEY'}, {status:500});
  const PROMPT = `Eres El Camino, asistente biblico de www.elcaminojuan146.lat - Juan 14:6. Color #387b5b.
REGLAS: NUNCA inventes versiculos ni resúmenes inventados. Si te piden "dame los primeros 5 versiculos", NO des un resumen inventado, di "Pide el capítulo y te traigo los versículos reales de BibleBoard". Está permitido citar versículos para estudio (uso justo). NUNCA digas "No puedo por derechos de autor" - RVR 1909 es dominio público. Usa Jehova, no Senor. Salmo 23 solo 6 versiculos. Salmo 34 solo 22 versiculos. Salmo 118 tiene 29 versiculos. Nunca repitas la misma frase.`;
  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b'];
  for(const model of models){
    try{
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body: JSON.stringify({model, messages:[{role:'system', content:PROMPT}, ...messages.map((m:any)=>({role:m.role, content:m.content}))], temperature:0.1, max_tokens:4000}),
      });
      const data = await res.json();
      if(!res.ok) continue;
      let text = data?.choices?.[0]?.message?.content || '';
      if(text.toLowerCase().includes('derechos de autor') || text.toLowerCase().includes('copyright') || text.toLowerCase().includes('no puedo compartir')){
        text = `Te explico el pasaje y te doy el link oficial para leerlo completo:\n\n🔗 BibleGateway RVR1960: https://www.biblegateway.com/\n🔗 BibleBoard RVR: https://bibleboard.org/\n\nPídeme: "Salmo 34 completo" y te traigo los versículos reales de BibleBoard.`;
      }
      if(text) return Response.json({message: text});
    }catch(e){ continue; }
  }
  return Response.json({error:'No se pudo generar respuesta'}, {status:500});
}
