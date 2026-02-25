/**
 * POST /api/complete-gocardless-checkout
 *
 * Vercel Serverless Function (Node.js Runtime)
 *
 * Called from /checkout/success after GoCardless redirects the user.
 * 1. Completes the GoCardless redirect flow → gets mandate_id + customer_id
 * 2. Creates a GoCardless subscription (SEPA direct debit)
 * 3. Finds or creates the Supabase user
 * 4. Creates/upserts the subscription record in the database
 * 5. Generates a Supabase magic link for auto-login
 *
 * Env vars (set in Vercel Dashboard > Settings > Environment Variables):
 *   GOCARDLESS_ACCESS_TOKEN
 *   GOCARDLESS_ENVIRONMENT  (sandbox | live)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   APP_URL
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    redirect_flow_id,
    session_token,
    plan,
    firstName,
    lastName,
    email,
    company,
    taxId,
    phone,
  } = req.body || {};

  if (!redirect_flow_id || !session_token || !email || !plan) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const gcAccessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
  const gcEnvironment = process.env.GOCARDLESS_ENVIRONMENT || 'sandbox';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.APP_URL || 'https://certiwize-appweb-main.vercel.app';

  if (!gcAccessToken || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const gcBaseUrl = gcEnvironment === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';

  const gcHeaders = {
    'Authorization': `Bearer ${gcAccessToken}`,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Certiwize/1.0',
  };

  try {
    // ── Step 1: Complete the GoCardless redirect flow ──────────────────────
    console.log('[GC] Step 1: Completing redirect flow:', redirect_flow_id);

    const completeRes = await fetch(
      `${gcBaseUrl}/redirect_flows/${redirect_flow_id}/actions/complete`,
      {
        method: 'POST',
        headers: { ...gcHeaders, 'Idempotency-Key': `complete-flow-${redirect_flow_id}` },
        body: JSON.stringify({ data: { session_token } }),
      }
    );

    if (!completeRes.ok) {
      const errText = await completeRes.text();
      console.error('[GC] Complete flow error:', completeRes.status, errText.substring(0, 300));
      return res.status(completeRes.status).json({ error: 'Echec validation GoCardless', details: errText.substring(0, 200) });
    }

    const completeData = await completeRes.json();
    const mandateId = completeData.redirect_flows.links.mandate;
    const gcCustomerId = completeData.redirect_flows.links.customer;

    console.log('[GC] Step 1 OK | Mandate:', mandateId, '| Customer:', gcCustomerId);

    // ── Step 2: Create GoCardless subscription ────────────────────────────
    const planConfig = {
      monthly: { amount: 14400, interval_unit: 'monthly', interval: 1, name: 'Certigestion — Mensuel' },
      yearly: { amount: 144000, interval_unit: 'yearly', interval: 1, name: 'Certigestion — Annuel' },
    };

    const selectedPlan = planConfig[plan] || planConfig.monthly;

    console.log('[GC] Step 2: Creating subscription:', selectedPlan.name);

    const subscriptionRes = await fetch(`${gcBaseUrl}/subscriptions`, {
      method: 'POST',
      headers: { ...gcHeaders, 'Idempotency-Key': `create-sub-${redirect_flow_id}` },
      body: JSON.stringify({
        subscriptions: {
          amount: selectedPlan.amount,
          currency: 'EUR',
          interval_unit: selectedPlan.interval_unit,
          interval: selectedPlan.interval,
          name: selectedPlan.name,
          links: { mandate: mandateId },
        },
      }),
    });

    if (!subscriptionRes.ok) {
      const errText = await subscriptionRes.text();
      console.error('[GC] Create subscription error:', subscriptionRes.status, errText.substring(0, 300));
      return res.status(subscriptionRes.status).json({ error: 'Echec creation abonnement', details: errText.substring(0, 200) });
    }

    const subscriptionData = await subscriptionRes.json();
    const gcSubscriptionId = subscriptionData.subscriptions.id;

    console.log('[GC] Step 2 OK | Subscription:', gcSubscriptionId);

    // ── Step 3: Find or create Supabase user ──────────────────────────────
    console.log('[Supabase] Step 3: Looking up user:', email);

    const usersRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    const usersData = await usersRes.json();
    let userId;
    let isNewUser = false;

    const existingUser = usersData.users?.find((u) => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
      console.log('[Supabase] Existing user:', userId);
    } else {
      console.log('[Supabase] Creating new user...');
      const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            company,
            phone,
          },
        }),
      });

      if (!createUserRes.ok) {
        const errData = await createUserRes.text();
        console.error('[Supabase] Create user error:', errData);
        return res.status(500).json({ error: 'Echec creation utilisateur', details: errData.substring(0, 200) });
      }

      const newUser = await createUserRes.json();
      userId = newUser.id;
      isNewUser = true;
      console.log('[Supabase] New user created:', userId);
    }

    // ── Step 4: Upsert subscription in Supabase ───────────────────────────
    const startsAt = new Date().toISOString();
    const endsAt = plan === 'yearly'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    console.log('[Supabase] Step 4: Upserting subscription');

    const subRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        plan,
        status: 'active',
        payment_provider: 'gocardless',
        external_subscription_id: gcSubscriptionId,
        external_customer_id: gcCustomerId,
        external_mandate_id: mandateId,
        amount: selectedPlan.amount,
        currency: 'EUR',
        billing_first_name: firstName,
        billing_last_name: lastName,
        billing_company: company || null,
        billing_tax_id: taxId || null,
        billing_email: email,
        billing_phone: phone || null,
        starts_at: startsAt,
        ends_at: endsAt,
        metadata: { redirect_flow_id, source: 'checkout' },
      }),
    });

    if (!subRes.ok) {
      const errText = await subRes.text();
      console.warn('[Supabase] Upsert subscription warning:', errText.substring(0, 200));
      // Non-blocking
    } else {
      console.log('[Supabase] Step 4 OK');
    }

    // ── Step 5: Generate Supabase magic link ──────────────────────────────
    console.log('[Supabase] Step 5: Generating magic link');

    const magicLinkRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'magiclink',
        email,
        options: { redirect_to: `${appUrl}/dashboard` },
      }),
    });

    if (!magicLinkRes.ok) {
      const errText = await magicLinkRes.text();
      console.error('[Supabase] Magic link error:', errText);
      return res.status(200).json({
        success: true,
        auto_login: false,
        is_new_user: isNewUser,
        message: 'Abonnement cree. Connectez-vous manuellement.',
      });
    }

    const magicLinkData = await magicLinkRes.json();
    const magicLinkUrl = magicLinkData.properties?.action_link
      || (magicLinkData.hashed_token
        ? `${supabaseUrl}/auth/v1/verify?token=${magicLinkData.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${appUrl}/dashboard`)}`
        : null);

    console.log('[GC] Checkout complete! User:', userId, '| Sub:', gcSubscriptionId);

    return res.status(200).json({
      success: true,
      auto_login: !!magicLinkUrl,
      is_new_user: isNewUser,
      magic_link_url: magicLinkUrl,
      user_id: userId,
    });

  } catch (err) {
    console.error('[GC] Error:', err);
    return res.status(500).json({ error: 'Erreur interne', details: err.message });
  }
}
