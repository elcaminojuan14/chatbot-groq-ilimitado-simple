
'use client';
import {useState,useRef,useEffect} from 'react';
const PRIMARY='#387b5b';
export default function Page(){
  const [msgs,setMsgs]=useState<any[]>([{role:'assistant', content:'Bendiciones! Soy El Camino, tu asistente bíblico - Juan 14:6. Pídeme un Salmo, un capítulo, un estudio o una oración. Ejemplo: Salmo 23 completo, Juan 14, ¿Qué significa Juan 14:6?'}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false);
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs,loading]);
  async function send(text?:string){
    const content = text || input; if(!content.trim()) return;
    const newMsgs = [...msgs, {role:'user', content}]; setMsgs(newMsgs as any); setInput(''); setLoading(true);
    try{
      const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({messages: newMsgs})});
      const data = await res.json(); if(data.error) throw new Error(data.error);
      setMsgs([...newMsgs, {role:'assistant', content: data.message}] as any);
    }catch(e:any){ setMsgs([...newMsgs, {role:'assistant', content: 'Error: '+ e.message}] as any); }
    setLoading(false);
  }
  function printChat(){
    const w = window.open('', '_blank'); if(!w) return;
    let html = '<html><head><title>El Camino Juan 14:6</title><style>body{font-family:sans-serif;padding:20px} .header{text-align:center;border-bottom:3px solid #387b5b;padding-bottom:12px} .msg{margin:12px 0;padding:10px;border-radius:12px} .user{background:#387b5b;color:white;text-align:right} .assistant{background:#f5f5f0;border:1px solid #ddd}</style></head><body>';
    html += '<div class="header"><h1 style="color:#387b5b">El Camino Juan 14:6</h1><div>www.elcaminojuan146.lat</div><div>'+ new Date().toLocaleString() +'</div></div>';
    msgs.forEach((m:any)=>{ html += '<div class="msg '+ m.role +'"><b>'+ (m.role==='user'?'Tu':'El Camino') +':</b><br/>'+ m.content.replace(/\n/g,'<br/>') +'</div>'; });
    html += '</body></html>'; w.document.write(html); w.document.close(); w.print();
  }
  function clearChat(){ if(confirm('¿Borrar chat?')) setMsgs([{role:'assistant', content:'Historial borrado. Bendiciones!'}]); }
  return (
    <div style={{minHeight:'100vh', background:'#f6f5f0', display:'flex', justifyContent:'center', padding:16}}>
      <div style={{width:'100%', maxWidth:760, display:'flex', flexDirection:'column', gap:12}}>
        <div style={{background:'white', borderRadius:20, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, border:'1px solid #e8e5de'}}>
          <img src="/logo.jpg" alt="logo" style={{width:48, height:48, borderRadius:12}} />
          <div style={{flex:1}}>
            <div style={{fontWeight:700, fontSize:18, color:PRIMARY}}>El Camino <span style={{fontSize:11, background:PRIMARY, color:'white', padding:'2px 8px', borderRadius:20}}>Juan 14:6</span></div>
            <div style={{fontSize:12, color:'#6b6a63'}}>Asistente bíblico - RVR 1960</div>
          </div>
          <button onClick={printChat} style={{width:36, height:36, borderRadius:10, border:'1px solid #e8e5de', cursor:'pointer'}}>🖨️</button>
          <button onClick={clearChat} style={{width:36, height:36, borderRadius:10, border:'1px solid #f0c0c0', background:'#fff5f5', cursor:'pointer'}}>🗑️</button>
        </div>
        <div style={{flex:1, background:'white', borderRadius:20, border:'1px solid #e8e5de', display:'flex', flexDirection:'column', overflow:'hidden', height:650}}>
          <div style={{flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:12, background:'#fdfcf8'}}>
            {msgs.map((m:any,i:number)=>(
              <div key={i} style={{display:'flex', gap:10, justifyContent: m.role==='user'?'flex-end':'flex-start'}}>
                {m.role!=='user' && <img src="/logo.jpg" alt="logo" style={{width:28, height:28, borderRadius:8, flexShrink:0}} />}
                <div style={{maxWidth:'78%', padding:'12px 16px', borderRadius: m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px', background: m.role==='user'?PRIMARY:'white', color: m.role==='user'?'white':'#2b2a27', border: m.role==='user'?'none':'1px solid #e8e5de', fontSize:14, whiteSpace:'pre-wrap'}}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{display:'flex', gap:10}}><img src="/logo.jpg" style={{width:28, height:28, borderRadius:8}} /><div style={{padding:'12px 16px', borderRadius:'4px 18px 18px 18px', background:'white', border:'1px solid #e8e5de'}}>Escribiendo...</div></div>}
            <div ref={endRef}></div>
          </div>
          <div style={{padding:'0 20px 8px', display:'flex', gap:6, flexWrap:'wrap'}}>
            {['Salmo 23 completo', 'Salmo 34 completo', 'Juan 14', '¿Qué significa Juan 14:6?'].map(q=>(
              <button key={q} onClick={()=>send(q)} style={{padding:'6px 12px', borderRadius:20, border:'1px solid #e8e5de', background:'#f6f5f0', fontSize:11, cursor:'pointer'}}>{q}</button>
            ))}
          </div>
          <div style={{padding:14, borderTop:'1px solid #e8e5de', background:'white', display:'flex', gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu pregunta bíblica..." style={{flex:1, padding:'12px 16px', borderRadius:24, border:'1px solid #e8e5de', background:'#f6f5f0'}} />
            <button onClick={()=>send()} style={{width:42, height:42, borderRadius:12, background:input.trim()?PRIMARY:'#e8e5de', color:'white', border:'none', cursor:'pointer'}}>↑</button>
          </div>
        </div>
        <div style={{fontSize:11, color:'#888', textAlign:'center'}}>El Camino Juan 14:6 • www.elcaminojuan146.lat</div>
      </div>
    </div>
  );
}
