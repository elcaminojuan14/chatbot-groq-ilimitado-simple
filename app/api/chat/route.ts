
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
        { role: 'system', content: 'Eres un asistente útil, amable y respondes en español. Eres un chatbot para Google Sites ilimitado.' },
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
