/**
 * POST /api/cancel-subscription
 *
 * Annule un abonnement GoCardless et met à jour Supabase.
 *
 * Body: { subscription_id, user_id }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscription_id, user_id } = req.body || {};

  if (!subscription_id || !user_id) {
    return res.status(400).json({ error: 'subscription_id et user_id requis' });
  }

  const gcAccessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
  const gcEnvironment = process.env.GOCARDLESS_ENVIRONMENT || 'sandbox';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!gcAccessToken || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const gcBaseUrl = gcEnvironment === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';

  try {
    // 1. Cancel the subscription on GoCardless
    console.log('[GC] Cancelling subscription:', subscription_id);

    const cancelRes = await fetch(`${gcBaseUrl}/subscriptions/${subscription_id}/actions/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gcAccessToken}`,
        'GoCardless-Version': '2015-07-06',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Certiwize/1.0',
      },
      body: JSON.stringify({}),
    });

    if (!cancelRes.ok) {
      const errText = await cancelRes.text();
      console.error('[GC] Cancel error:', cancelRes.status, errText.substring(0, 300));
      return res.status(cancelRes.status).json({ error: 'Echec annulation GoCardless', details: errText.substring(0, 200) });
    }

    console.log('[GC] Subscription cancelled');

    // 2. Update subscription status in Supabase
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateRes.ok) {
      console.warn('[Supabase] Update subscription warning:', await updateRes.text());
    }

    return res.status(200).json({ success: true, message: 'Abonnement annulé' });

  } catch (err) {
    console.error('[GC] Cancel error:', err);
    return res.status(500).json({ error: 'Erreur interne', details: err.message });
  }
}
