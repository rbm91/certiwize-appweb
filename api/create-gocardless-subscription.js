/**
 * POST /api/create-gocardless-subscription
 *
 * Vercel Serverless Function (Node.js Runtime)
 * Creates a GoCardless Redirect Flow for SEPA mandate collection.
 *
 * Env vars (set in Vercel Dashboard > Settings > Environment Variables):
 *   GOCARDLESS_ACCESS_TOKEN
 *   GOCARDLESS_ENVIRONMENT  (sandbox | live)
 *   APP_URL                 (ex: https://certiwize-appweb-main.vercel.app)
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, firstName, lastName, email, company, phone, sessionToken } = req.body || {};

  if (!plan || !firstName || !lastName || !email || !sessionToken) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
  const environment = process.env.GOCARDLESS_ENVIRONMENT || 'sandbox';
  const appUrl = process.env.APP_URL || 'https://certiwize-appweb-main.vercel.app';

  if (!accessToken) {
    return res.status(500).json({ error: 'GOCARDLESS_ACCESS_TOKEN manquant' });
  }

  const gcBaseUrl = environment === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';

  const planDescriptions = {
    monthly: 'Certigestion — Abonnement mensuel (120 € HT/mois)',
    yearly: 'Certigestion — Abonnement annuel (1 200 € HT/an)',
  };

  const description = planDescriptions[plan] || planDescriptions.monthly;
  const successRedirectUrl = `${appUrl}/checkout/success`;

  try {
    console.log('[GC] Calling', gcBaseUrl, '| env:', environment);

    const gcResponse = await fetch(`${gcBaseUrl}/redirect_flows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'GoCardless-Version': '2015-07-06',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Certiwize/1.0',
        'Idempotency-Key': `create-flow-${sessionToken}`,
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
            country_code: 'FR',
          },
          scheme: 'sepa_core',
        },
      }),
    });

    console.log('[GC] Response:', gcResponse.status, gcResponse.headers.get('content-type'));

    const contentType = gcResponse.headers.get('content-type') || '';

    if (!gcResponse.ok) {
      if (contentType.includes('json')) {
        const errorData = await gcResponse.json();
        console.error('[GC] Error:', JSON.stringify(errorData));
        return res.status(gcResponse.status).json({ error: 'Erreur GoCardless', details: errorData });
      } else {
        const errorText = await gcResponse.text();
        console.error('[GC] Non-JSON error:', gcResponse.status, errorText.substring(0, 300));
        return res.status(502).json({
          error: 'GoCardless a renvoyé une réponse inattendue',
          status: gcResponse.status,
          env: environment,
        });
      }
    }

    const data = await gcResponse.json();

    return res.status(200).json({
      redirect_url: data.redirect_flows.redirect_url,
      redirect_flow_id: data.redirect_flows.id,
    });

  } catch (err) {
    console.error('[GC] Error:', err);
    return res.status(500).json({ error: 'Erreur interne', details: err.message });
  }
}
