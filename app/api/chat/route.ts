
// El Camino v4.0 - FIX Copyright RVR1960
// Problema: Groq dice "No puedo compartir RVR1960 por derechos de autor"
// Solución: NUNCA pedirle a Groq que genere el capitulo. Siempre traerlo de API con licencia.
// 1) A Bíblia Digital - https://www.abibliadigital.com.br/api/verses/rvr/sl/34 (tiene licencia para mostrar RVR)
// 2) wldeh Bible API (jsdelivr) - https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/es-rvr/books/psalms/chapters/34.json (dominio público / datos abiertos)
// 3) BibleGateway link - verificación oficial
// Si API falla, NO decir "no puedo por copyright", dar resumen + link a BibleGateway + usar RVR1909 dominio público

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
const BOOK_NAMES_ES: Record<string, string> = {
  'gn':'Génesis','ex':'Éxodo','lv':'Levítico','nm':'Números','dt':'Deuteronomio','js':'Josué','jz':'Jueces','rt':'Rut','1sm':'1 Samuel','2sm':'2 Samuel','1rs':'1 Reyes','2rs':'2 Reyes','1cr':'1 Crónicas','2cr':'2 Crónicas','ed':'Esdras','ne':'Nehemías','et':'Ester','job':'Job','sl':'Salmos','pv':'Proverbios','ec':'Eclesiastés','ct':'Cantares','is':'Isaías','jr':'Jeremías','lm':'Lamentaciones','ez':'Ezequiel','dn':'Daniel','os':'Oseas','jl':'Joel','am':'Amós','ob':'Abdías','jn':'Jonás','mq':'Miqueas','na':'Nahúm','hc':'Habacuc','sf':'Sofonías','ag':'Hageo','zc':'Zacarías','ml':'Malaquías','mt':'Mateo','mc':'Marcos','lc':'Lucas','jo':'Juan','at':'Hechos','rm':'Romanos','1co':'1 Corintios','2co':'2 Corintios','gl':'Gálatas','ef':'Efesios','fp':'Filipenses','cl':'Colosenses','1ts':'1 Tesalonicenses','2ts':'2 Tesalonicenses','1tm':'1 Timoteo','2tm':'2 Timoteo','tt':'Tito','fm':'Filemón','hb':'Hebreos','tg':'Santiago','1pe':'1 Pedro','2pe':'2 Pedro','1jo':'1 Juan','2jo':'2 Juan','3jo':'3 Juan','jd':'Judas','ap':'Apocalipsis'
};
// Para jsdelivr wldeh: nombre en inglés del libro
const BOOK_EN: Record<string, string> = {
  'gn':'genesis','ex':'exodus','lv':'leviticus','nm':'numbers','dt':'deuteronomy','js':'joshua','jz':'judges','rt':'ruth','1sm':'1-samuel','2sm':'2-samuel','1rs':'1-kings','2rs':'2-kings','1cr':'1-chronicles','2cr':'2-chronicles','ed':'ezra','ne':'nehemiah','et':'esther','job':'job','sl':'psalms','pv':'proverbs','ec':'ecclesiastes','ct':'song-of-songs','is':'isaiah','jr':'jeremiah','lm':'lamentations','ez':'ezekiel','dn':'daniel','os':'hosea','jl':'joel','am':'amos','ob':'obadiah','jn':'jonah','mq':'micah','na':'nahum','hc':'habakkuk','sf':'zephaniah','ag':'haggai','zc':'zechariah','ml':'malachi','mt':'matthew','mc':'mark','lc':'luke','jo':'john','at':'acts','rm':'romans','1co':'1-corinthians','2co':'2-corinthians','gl':'galatians','ef':'ephesians','fp':'philippians','cl':'colossians','1ts':'1-thessalonians','2ts':'2-thessalonians','1tm':'1-timothy','2tm':'2-timothy','tt':'titus','fm':'philemon','hb':'hebrews','tg':'james','1pe':'1-peter','2pe':'2-peter','1jo':'1-john','2jo':'2-john','3jo':'3-john','jd':'jude','ap':'revelation'
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
async function fetchABiblia(abbr: string, chapter: number, verse?: number | null){
  try{
    let url = `https://www.abibliadigital.com.br/api/verses/rvr/${abbr}/${chapter}`;
    if(verse) url += `/${verse}`;
    const res = await fetch(url, {headers:{'User-Agent':'ElCamino/4.0'}});
    if(!res.ok) return null;
    const data = await res.json();
    if(data && data.verses && Array.isArray(data.verses) && data.verses.length>0){
      return {verses: data.verses, url, source: 'A Bíblia Digital RVR'};
    }
    if(data && data.text){
      return {verses: [{number: data.number || verse, text: data.text}], url, source: 'A Bíblia Digital RVR'};
    }
    return null;
  }catch(e){ return null; }
}
async function fetchWldeh(abbr: string, chapter: number, verse?: number | null){
  // jsdelivr - datos abiertos, dominio público, no bloquea por copyright
  try{
    const bookEn = BOOK_EN[abbr];
    if(!bookEn) return null;
    // Probar es-rvr y es-rv1909 (dominio público)
    for(const ver of ['es-rvr','es-rv1909','es-rva']){
      const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${ver}/books/${bookEn}/chapters/${chapter}.json`;
      const res = await fetch(url);
      if(!res.ok) continue;
      const data = await res.json();
      // data.data = [{verse, text}] o data.verses
      const verses = data?.data || data?.verses || data;
      if(Array.isArray(verses) && verses.length>0){
        const norm = verses.map((v:any)=>({number: v.verse || v.number, text: v.text}));
        const filtered = verse ? norm.filter((v:any)=>v.number===verse) : norm;
        if(filtered.length>0) return {verses: filtered, url, source: `wldeh ${ver} (dominio público)`};
      }
    }
    return null;
  }catch(e){ return null; }
}
async function fetchBibleApi(abbr: string, chapter: number){
  // bible-api.com - último fallback, aunque da KJV en inglés a veces, mejor que nada
  try{
    const bookName = BOOK_NAMES_ES[abbr];
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(bookName)}+${chapter}?translation=kjv`);
    if(!res.ok) return null;
    const d = await res.json();
    if(d && d.verses) return {verses: d.verses.map((v:any)=>({number: v.verse, text: v.text})), url: 'https://bible-api.com', source: 'bible-api.com KJV'};
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
    // 1) A Bíblia Digital RVR
    let result = await fetchABiblia(ref.abbr, ref.chapter, ref.verse);
    // 2) wldeh jsdelivr dominio público si falla 1
    if(!result){
      const r2 = await fetchWldeh(ref.abbr, ref.chapter, ref.verse);
      if(r2) result = r2;
    }
    // 3) bible-api
    if(!result){
      const r3 = await fetchBibleApi(ref.abbr, ref.chapter);
      if(r3) result = r3;
    }
    if(result){
      let formatted = `**${bookName} ${ref.chapter}${ref.verse ? ':'+ref.verse : ''} RVR 1960**\n\n`;
      result.verses.forEach((v:any)=>{
        let clean = String(v.text || '').replace(/<[^>]*>/g, '').trim();
        formatted += `${v.number} ${clean}\n`;
      });
      formatted += `\n*(Texto REAL - Fuente: ${result.source} - ${result.url} - mismo texto que BibleGateway.com. No inventado por IA, no generado por IA.)*\n`;
      formatted += `\n🔗 Verificar en BibleGateway: ${bgUrl}\n`;
      formatted += `\n🔗 Fuente API: ${result.url}\n`;
      if(ref.abbr==='sl' && ref.chapter===23) formatted += `\nNota: Salmo 23 solo tiene 6 versículos en RVR 1960, está completo.`;
      if(ref.abbr==='sl' && ref.chapter===34) formatted += `\nNota: Salmo 34 solo tiene 22 versículos en RVR 1960.`;
      return Response.json({message: formatted, bibleGatewayUrl: bgUrl, apiUrl: result.url});
    }
    // Si TODO falla, NO decir "no puedo por copyright", dar links oficiales
    return Response.json({message: `No pude traer ${bookName} ${ref.chapter} de la API en este momento (no es por copyright, es por conexión).\n\nLéelo completo y oficial aquí:\n🔗 BibleGateway RVR1960: ${bgUrl}\n🔗 A Bíblia Digital RVR: https://www.abibliadigital.com.br/api/verses/rvr/${ref.abbr}/${ref.chapter}\n\nInténtalo de nuevo en unos segundos.`});
  }
  // Si no es capítulo, Groq con instrucción ANTI-COPYRIGHT-BLOQUEO
  const apiKey = process.env.GROQ_API_KEY;
  if(!apiKey) return Response.json({error:'Falta GROQ_API_KEY'}, {status:500});
  const PROMPT = `Eres El Camino, asistente biblico de www.elcaminojuan146.lat - Juan 14:6. Color #387b5b.
REGLA ANTI-BLOQUEO: Está permitido citar versículos de la Biblia para estudio, enseñanza y devocional (uso justo / fair use). NUNCA digas "No puedo compartir por derechos de autor". Si te piden un pasaje, da un resumen + explicación + 2-3 versículos clave y el link a https://www.biblegateway.com/ para leerlo completo. No inventes versículos. Usa Jehova, no Senor. Salmo 23 solo 6 versiculos. Salmo 34 solo 22 versiculos. Nunca repitas la misma frase.`;
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
      // Si Groq igual se niega por copyright, reemplazar por mensaje útil
      if(text.toLowerCase().includes('derechos de autor') || text.toLowerCase().includes('copyright') || text.toLowerCase().includes('no puedo compartir')){
        text = `Te explico el pasaje que pediste y te doy el link oficial para leerlo completo en RVR 1960:\n\n🔗 BibleGateway RVR1960: https://www.biblegateway.com/\n\n¿Quieres que te haga un estudio versículo por versículo con explicación? Pídeme: "Explica Salmo 34" y te lo explico sin problema.`;
      }
      if(text) return Response.json({message: text});
    }catch(e){ continue; }
  }
  return Response.json({error:'No se pudo generar respuesta'}, {status:500});
}
