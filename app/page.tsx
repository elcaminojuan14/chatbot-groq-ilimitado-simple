
'use client';
import { useState } from 'react';

export default function Page(){
  const [msgs,setMsgs]=useState([{role:'assistant',content:'¡Hola! Soy tu chatbot ilimitado con Groq. Pregúntame lo que quieras.'}]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);

  async function send(){
    if(!input.trim()) return;
    const newMsgs=[...msgs,{role:'user',content:input}];
    setMsgs(newMsgs as any);
    setInput('');
    setLoading(true);
    try{
      const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:newMsgs})});
      const data=await res.json();
      if(data.error) throw new Error(data.error);
      setMsgs([...newMsgs,{role:'assistant',content:data.message}] as any);
    }catch(e:any){
      setMsgs([...newMsgs,{role:'assistant',content:'Error: '+e.message}] as any);
    }
    setLoading(false);
  }

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:20}}>
      <h1 style={{textAlign:'center'}}>Chatbot Ilimitado - Vercel + Groq</h1>
      <p style={{textAlign:'center',color:'#666'}}>14,400 chats/día gratis • Para Google Sites</p>
      <div style={{border:'1px solid #ddd',borderRadius:12,height:500,overflowY:'auto',padding:16,background:'#fafafa'}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{margin:'8px 0',textAlign:m.role==='user'?'right':'left'}}>
            <span style={{display:'inline-block',padding:'10px 14px',borderRadius:16,background:m.role==='user'?'#0042DA':'white',color:m.role==='user'?'white':'black',border:'1px solid #ddd',maxWidth:'80%'}}>{m.content}</span>
          </div>
        ))}
        {loading && <div style={{color:'#888'}}>Escribiendo...</div>}
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Escribe tu mensaje..." style={{flex:1,padding:12,borderRadius:10,border:'1px solid #ccc'}} />
        <button onClick={send} disabled={loading} style={{padding:'12px 20px',borderRadius:10,background:'#0042DA',color:'white',border:'none',cursor:'pointer'}}>Enviar</button>
      </div>
    </div>
  );
}
