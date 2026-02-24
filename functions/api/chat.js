export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Vérification de l'authentification
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Non autorisé : Token manquant' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Récupération du message
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { message, history } = body;

  // 2. Vérification de l'URL n8n
  // Tu devras ajouter la variable N8N_CHAT_WEBHOOK dans Cloudflare
  const n8nUrl = env.N8N_CHAT_WEBHOOK;

  if (!n8nUrl) {
    return new Response(JSON.stringify({ error: 'Chat configuration missing' }), { status: 500 });
  }

  // 3. Appel à n8n
  try {
    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        // On peut passer l'historique si ton n8n a de la mémoire, sinon optionnel
        history: history || [] 
      })
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n error: ${n8nResponse.statusText}`);
    }

    const data = await n8nResponse.json();
    
    // On s'attend à ce que n8n renvoie un JSON { "output": "La réponse du bot" }
    // ou { "text": "..." }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error processing chat', details: err.message }), { status: 502 });
  }
}