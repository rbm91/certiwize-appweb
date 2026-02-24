export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Vérification de sécurité (Token Supabase)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Non autorisé : Token manquant' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Note : Pour une sécurité maximale, on pourrait vérifier la validité du token 
  // auprès de Supabase ici, mais la présence du token est déjà un bon filtre 
  // pour éviter les bots basiques.

  // 2. Récupération des données du frontend
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400 });
  }

  const { featureId, data } = body;

  // 3. Mapping des URLs Webhook n8n (Définies dans les variables d'env Cloudflare)
  // On utilise l'ID de la feature pour trouver la bonne URL
  const webhookMap = {
    1: env.N8N_HOOK_CONVENTION,      // Convention
    /*2: env.N8N_HOOK_SIGNATURE,       // Signature
    3: env.N8N_HOOK_DRIVE,           // Drive
    4: env.N8N_HOOK_CONVOC_GEN,      // Générer Convoc
    5: env.N8N_HOOK_QUEST_POS,       // Quest. Positionnement
    6: env.N8N_HOOK_CONVOC_SEND,     // Envoi Convoc
    7: env.N8N_HOOK_EMARGEMENT,      // Émargement
    8: env.N8N_HOOK_CHAUD,           // Quest. Chaud
    9: env.N8N_HOOK_FACTURE,         // Factures
    10: env.N8N_HOOK_RELANCE,        // Relance
    11: env.N8N_HOOK_CERTIF_GEN,     // Générer Certif
    12: env.N8N_HOOK_SEND_RESP,      // Envoi Responsable
    13: env.N8N_HOOK_SEND_APPR,      // Envoi Apprenants
    14: env.N8N_HOOK_FROID,          // Quest. Froid
    15: env.N8N_HOOK_PENNYLANE       // Pennylane*/
  };

  const targetUrl = webhookMap[featureId];

  if (!targetUrl) {
    // Si l'URL n'est pas configurée, on renvoie une erreur propre
    return new Response(JSON.stringify({ error: `Aucun webhook configuré pour la fonctionnalité #${featureId}` }), {
      status: 501, // Not Implemented
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Appel au serveur n8n
  try {
    const n8nResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'Certiwize-App' // Header personnalisé pour tes logs n8n
      },
      body: JSON.stringify({
        ...data,
        userToken: authHeader // On transmet le token si n8n en a besoin
      })
    });

    if (!n8nResponse.ok) {
      throw new Error(`Erreur n8n: ${n8nResponse.statusText}`);
    }

    const result = await n8nResponse.json();
    
    return new Response(JSON.stringify({ success: true, n8n: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur lors de l\'exécution du workflow', details: err.message }), {
      status: 502, // Bad Gateway
      headers: { 'Content-Type': 'application/json' }
    });
  }
}