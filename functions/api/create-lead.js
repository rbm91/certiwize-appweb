/**
 * POST /api/create-lead
 *
 * Enregistre un lead (demande de démo) dans la table `leads`.
 * Accessible sans authentification (formulaire public /schedule).
 *
 * Body:
 *   { fullName, email, phone?, company?, message?, source? }
 *
 * Env vars requis:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  const { fullName, email, phone, company, message, source } = body;

  if (!fullName || !email) {
    return new Response(
      JSON.stringify({ error: 'Champs requis manquants: fullName, email' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Adresse email invalide' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Configuration serveur manquante' }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone: phone || null,
        company: company || null,
        message: message || null,
        source: source || 'schedule_page',
        status: 'new'
      })
    });

    if (!insertRes.ok) {
      const errData = await insertRes.json();
      console.error('Supabase insert lead error:', errData);
      return new Response(
        JSON.stringify({ error: 'Échec de l\'enregistrement', details: errData }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: corsHeaders }
    );

  } catch (err) {
    console.error('create-lead error:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur interne', details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
