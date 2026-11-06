
// El Camino v3.8 - FUENTES REALES:
// 1) PRIMARY: https://bolls.life/get-text/RVR/{libro}/{capitulo}/  -> RVR 1960 español REAL
//    Ej: https://bolls.life/get-text/RVR/19/34/ = Salmos 34, https://bolls.life/get-text/RVR/19/23/ = Salmos 23
// 2) VERIFICACION: https://www.biblegateway.com/passage/?search=Salmo+34&version=RVR1960
// 3) NO usa bible-api.com (esa da inglés KJV)

const BOOK_NUMBERS: Record<string, number> = {
  'genesis': 1, 'exodo': 2, 'levitico': 3, 'numeros': 4, 'deuteronomio': 5,
  'josue': 6, 'jueces': 7, 'rut': 8, '1samuel': 9, '2samuel': 10, '1reyes': 11, '2reyes': 12,
  '1cronicas': 13, '2cronicas': 14, 'esdras': 15, 'nehemias': 16, 'ester': 17, 'job': 18,
  'salmos': 19, 'salmo': 19, 'proverbios': 20, 'eclesiastes': 21, 'cantares': 22, 'isaias': 23,
  'jeremias': 24, 'lamentaciones': 25, 'ezequiel': 26, 'daniel': 27, 'oseas': 28, 'joel': 29,
  'amos': 30, 'abdias': 31, 'jonas': 32, 'miqueas': 33, 'nahum': 34, 'habacuc': 35, 'sofonias': 36,
  'hageo': 37, 'zacarias': 38, 'malaquias': 39,
  'mateo': 40, 'marcos': 41, 'lucas': 42, 'juan': 43, 'hechos': 44, 'romanos': 45,
  '1corintios': 46, '2corintios': 47, 'galatas': 48, 'efesios': 49, 'filipenses': 50, 'colosenses': 51,
  '1tesalonicenses': 52, '2tesalonicenses': 53, '1timoteo': 54, '2timoteo': 55, 'tito': 56,
  'filemon': 57, 'hebreos': 58, 'santiago': 59, '1pedro': 60, '2pedro': 61, '1juan': 62,
  '2juan': 63, '3juan': 64, 'judas': 65, 'apocalipsis': 66,
};
const BOOK_NAMES_ES: Record<number, string> = {
  1:'Génesis',2:'Éxodo',3:'Levítico',4:'Números',5:'Deuteronomio',6:'Josué',7:'Jueces',8:'Rut',9:'1 Samuel',10:'2 Samuel',11:'1 Reyes',12:'2 Reyes',13:'1 Crónicas',14:'2 Crónicas',15:'Esdras',16:'Nehemías',17:'Ester',18:'Job',19:'Salmos',20:'Proverbios',21:'Eclesiastés',22:'Cantares',23:'Isaías',24:'Jeremías',25:'Lamentaciones',26:'Ezequiel',27:'Daniel',28:'Oseas',29:'Joel',30:'Amós',31:'Abdías',32:'Jonás',33:'Miqueas',34:'Nahúm',35:'Habacuc',36:'Sofonías',37:'Hageo',38:'Zacarías',39:'Malaquías',40:'Mateo',41:'Marcos',42:'Lucas',43:'Juan',44:'Hechos',45:'Romanos',46:'1 Corintios',47:'2 Corintios',48:'Gálatas',49:'Efesios',50:'Filipenses',51:'Colosenses',52:'1 Tesalonicenses',53:'2 Tesalonicenses',54:'1 Timoteo',55:'2 Timoteo',56:'Tito',57:'Filemón',58:'Hebreos',59:'Santiago',60:'1 Pedro',61:'2 Pedro',62:'1 Juan',63:'2 Juan',64:'3 Juan',65:'Judas',66:'Apocalipsis'
};
function parseRef(text: string){
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const m = lower.match(/(salmo|salmos|genesis|exodo|levitico|numeros|deuteronomio|josue|jueces|rut|1\s?samuel|2\s?samuel|1\s?reyes|2\s?reyes|job|proverbios|eclesiastes|cantares|isaias|jeremias|ezequiel|daniel|oseas|joel|amos|jonas|miqueas|nahum|habacuc|sofonias|hageo|zacarias|malaquias|mateo|marcos|lucas|juan|hechos|romanos|1\s?corintios|2\s?corintios|galatas|efesios|filipenses|colosenses|1\s?tesalonicenses|2\s?tesalonicenses|1\s?timoteo|2\s?timoteo|tito|filemon|hebreos|santiago|1\s?pedro|2\s?pedro|1\s?juan|2\s?juan|3\s?juan|judas|apocalipsis)\s*(\d+)(?::(\d+))?/);
  if(!m) return null;
  let bookKey = m[1].replace(/\s/g,'');
  if(bookKey==='salmo') bookKey='salmos';
  const bookNum = BOOK_NUMBERS[bookKey];
  if(!bookNum) return null;
  return {bookKey, bookNum, chapter: parseInt(m[2]), verse: m[3] ? parseInt(m[3]) : null};
}
function bibleGatewayUrl(bookName: string, chapter: number, verse?: number | null){
  const search = verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`;
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(search)}&version=RVR1960`;
}
function bollsUrl(bookNum: number, chapter: number, verse?: number | null){
  // FUENTE PRINCIPAL: bolls.life/get-text/RVR/?
  // Ejemplo exacto que pidió Juan: https://bolls.life/get-text/RVR/19/34/
  let u = `https://bolls.life/get-text/RVR/${bookNum}/${chapter}/`;
  if(verse) u += `${verse}/`;
  return u;
}
async function fetchBollsRVR(bookNum: number, chapter: number, verse?: number | null){
  const url = bollsUrl(bookNum, chapter, verse);
  try{
    const res = await fetch(url, {headers:{'User-Agent':'ElCamino/3.8'}});
    if(!res.ok) return null;
    const data = await res.json();
    if(!data || !Array.isArray(data) || data.length===0) return null;
    return {data, url};
  }catch(e){ return null; }
}
export async function POST(req: Request){
  let messages: any[] = [];
  try{ const body = await req.json(); messages = body.messages || []; }catch(e){ return Response.json({error:'JSON invalido'}, {status:400}); }
  const lastUser = [...messages].reverse().find((m:any)=>m.role==='user')?.content || '';
  const ref = parseRef(lastUser);
  if(ref){
    const bookName = BOOK_NAMES_ES[ref.bookNum] || ref.bookKey;
    const bgUrl = bibleGatewayUrl(bookName, ref.chapter, ref.verse);
    const result = await fetchBollsRVR(ref.bookNum, ref.chapter, ref.verse);
    if(result){
      let formatted = `**${bookName} ${ref.chapter}${ref.verse ? ':'+ref.verse : ''} RVR 1960**\n\n`;
      result.data.forEach((v:any)=>{
        let cleanText = String(v.text || '').replace(/<[^>]*>/g, '').trim();
        formatted += `${v.verse} ${cleanText}\n`;
      });
      formatted += `\n*(Texto REAL RVR 1960 en español - Fuente principal: ${result.url} - mismo texto que BibleGateway.com. No inventado por IA.)*\n`;
      formatted += `\n🔗 Verificar en BibleGateway: ${bgUrl}\n`;
      formatted += `\n🔗 Fuente bolls.life: ${result.url}\n`;
      if(ref.bookNum===19 && ref.chapter===23) formatted += `\nNota: Salmo 23 solo tiene 6 versículos en RVR 1960, está completo.`;
      if(ref.bookNum===19 && ref.chapter===34) formatted += `\nNota: Salmo 34 solo tiene 22 versículos en RVR 1960.`;
      return Response.json({message: formatted, bibleGatewayUrl: bgUrl, bollsUrl: result.url});
    }
    return Response.json({message: `No pude traer ${bookName} ${ref.chapter} de bolls.life en este momento.\n\nVerifícalo aquí:\n🔗 BibleGateway: ${bgUrl}\n🔗 bolls.life: ${bollsUrl(ref.bookNum, ref.chapter, ref.verse)}\n\nInténtalo de nuevo, no quiero inventar versículos.`});
  }
  const apiKey = process.env.GROQ_API_KEY;
  if(!apiKey) return Response.json({error:'Falta GROQ_API_KEY'}, {status:500});
  const PROMPT = `Eres El Camino, asistente biblico de www.elcaminojuan146.lat - Juan 14:6. Color #387b5b.
FUENTES REALES: 1) https://bolls.life/get-text/RVR/ -> RVR 1960 español REAL (ej: https://bolls.life/get-text/RVR/19/34/) 2) https://www.biblegateway.com/ RVR1960
REGLA: NUNCA inventes versiculos. Si no sabes el texto exacto, di "Verifica en https://www.biblegateway.com/ o https://bolls.life/get-text/RVR/". Usa Jehova, no Senor. Salmo 23 solo 6 versiculos. Salmo 34 solo 22 versiculos. Nunca repitas la misma frase.`;
  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b'];
  for(const model of models){
    try{
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body: JSON.stringify({model, messages:[{role:'system', content:PROMPT}, ...messages.map((m:any)=>({role:m.role, content:m.content}))], temperature:0.1, max_tokens:4000}),
      });
      const data = await res.json();
      if(!res.ok) continue;
      const text = data?.choices?.[0]?.message?.content;
      if(text) return Response.json({message: text});
    }catch(e){ continue; }
  }
  return Response.json({error:'No se pudo generar respuesta'}, {status:500});
}
