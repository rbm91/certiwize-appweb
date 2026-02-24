/**
 * POST /api/create-gocardless-subscription
 *
 * Crée un GoCardless Redirect Flow pour collecter un mandat SEPA.
 * Retourne l'URL de redirection vers la page GoCardless.
 *
 * Body:
 *   { plan, firstName, lastName, email, company, taxId, phone, sessionToken }
 *
 * Env vars requis:
 *   GOCARDLESS_ACCESS_TOKEN
 *   GOCARDLESS_ENVIRONMENT  (sandbox | live)
 *   APP_URL                 (ex: https://app.certiwize.com)
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

  const { plan, firstName, lastName, email, company, taxId, phone, sessionToken } = body;

  if (!plan || !firstName || !lastName || !email || !sessionToken) {
    return new Response(
      JSON.stringify({ error: 'Champs requis manquants: plan, firstName, lastName, email, sessionToken' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const accessToken = env.GOCARDLESS_ACCESS_TOKEN;
  const environment = env.GOCARDLESS_ENVIRONMENT || 'sandbox';
  const appUrl = env.APP_URL || 'http://localhost:5173';

  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: 'GoCardless non configuré' }),
      { status: 500, headers: corsHeaders }
    );
  }

  const gcBaseUrl = environment === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';

  const planDescriptions = {
    monthly: 'Certigestion — Abonnement mensuel (144 €/mois)',
    yearly: 'Certigestion — Abonnement annuel (1 440 €/an)'
  };

  const description = planDescriptions[plan] || planDescriptions.monthly;
  const successRedirectUrl = `${appUrl}/checkout/success`;

  try {
    const gcResponse = await fetch(`${gcBaseUrl}/redirect_flows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'GoCardless-Version': '2015-07-06',
        'Content-Type': 'application/json',
        'Idempotency-Key': `create-flow-${sessionToken}`
      },
      body: JSON.stringify({
        redirect_flows: {
          description,
          session_token: sessionToken,
          success_redirect_url: successRedirectUrl,
          prefilled_customer: {
            given_name: firstName,
            family_name: lastName,
            email,
            ...(company && { company_name: company }),
            ...(phone && { phone_number: phone }),
            country_code: 'FR'
          },
          scheme: 'sepa_core'
        }
      })
    });

    if (!gcResponse.ok) {
      const errorData = await gcResponse.json();
      console.error('GoCardless error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erreur GoCardless', details: errorData }),
        { status: gcResponse.status, headers: corsHeaders }
      );
    }

    const data = await gcResponse.json();
    const redirectUrl = data.redirect_flows.redirect_url;
    const redirectFlowId = data.redirect_flows.id;

    return new Response(
      JSON.stringify({ redirect_url: redirectUrl, redirect_flow_id: redirectFlowId }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('create-gocardless-subscription error:', err);
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
