
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'Falta GROQ_API_KEY en Vercel > Settings > Environment Variables' }, { status: 500 });
    }
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Eres El Camino, asistente bíblico. NUNCA RESUMAS. Dame el texto COMPLETO versículo por versículo, palabra por palabra, sin resumir, sin parafrasear, sin cambiar palabras. No inventas versículos ni los reconstruyes. Si te piden Salmo 1, dame los 6 versículos completos. Si te piden Salmo 34, dame los 22 versículos completos. Si te piden Salmo 118, dame los 29 versículos completosEres un asistente útil, respondes en español, amable si el usuario te escribe en otro idioma le continuas respondiendo en ese idioma o al solilitarlo cambias de idioma. ayudas a encontrar versiculos de la biblia de preferencia la reina valera 1960, no inventas versiculos ni los reconstruyes.' },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      model: 'openai/gpt-oss-20b',
      temperature: 0.2,
      max_tokens: 4000,
    });
    return Response.json({ message: completion.choices[0]?.message?.content || 'Sin respuesta' });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message || 'Error en Groq' }, { status: 500 });
  }
}
