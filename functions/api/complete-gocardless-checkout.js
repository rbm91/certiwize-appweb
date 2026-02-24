/**
 * POST /api/complete-gocardless-checkout
 *
 * Appelé depuis /checkout/success après que GoCardless redirige l'utilisateur.
 * 1. Complète le redirect flow GoCardless → obtient mandate_id + customer_id
 * 2. Crée l'abonnement GoCardless (subscription)
 * 3. Cherche ou crée l'utilisateur Supabase (via service role)
 * 4. Crée/met à jour l'entrée dans la table `subscriptions`
 * 5. Génère un magic link Supabase pour auto-login
 * 6. Retourne { magic_link_url }
 *
 * Body:
 *   { redirect_flow_id, session_token, plan, firstName, lastName, email, company, taxId, phone }
 *
 * Env vars requis:
 *   GOCARDLESS_ACCESS_TOKEN
 *   GOCARDLESS_ENVIRONMENT  (sandbox | live)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   APP_URL
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

  const {
    redirect_flow_id,
    session_token,
    plan,
    firstName,
    lastName,
    email,
    company,
    taxId,
    phone
  } = body;

  if (!redirect_flow_id || !session_token || !email || !plan) {
    return new Response(
      JSON.stringify({ error: 'Champs requis manquants: redirect_flow_id, session_token, email, plan' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const gcAccessToken = env.GOCARDLESS_ACCESS_TOKEN;
  const gcEnvironment = env.GOCARDLESS_ENVIRONMENT || 'sandbox';
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = env.APP_URL || 'http://localhost:5173';

  if (!gcAccessToken || !supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Configuration serveur manquante' }),
      { status: 500, headers: corsHeaders }
    );
  }

  const gcBaseUrl = gcEnvironment === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com';

  const gcHeaders = {
    'Authorization': `Bearer ${gcAccessToken}`,
    'GoCardless-Version': '2015-07-06',
    'Content-Type': 'application/json'
  };

  try {
    // ── Step 1: Complete the GoCardless redirect flow ─────────────────────────
    const completeRes = await fetch(
      `${gcBaseUrl}/redirect_flows/${redirect_flow_id}/actions/complete`,
      {
        method: 'POST',
        headers: { ...gcHeaders, 'Idempotency-Key': `complete-flow-${redirect_flow_id}` },
        body: JSON.stringify({ data: { session_token } })
      }
    );

    if (!completeRes.ok) {
      const errData = await completeRes.json();
      console.error('GoCardless complete flow error:', errData);
      return new Response(
        JSON.stringify({ error: 'Échec de la validation GoCardless', details: errData }),
        { status: completeRes.status, headers: corsHeaders }
      );
    }

    const completeData = await completeRes.json();
    const mandateId = completeData.redirect_flows.links.mandate;
    const gcCustomerId = completeData.redirect_flows.links.customer;

    // ── Step 2: Create GoCardless subscription ────────────────────────────────
    const planConfig = {
      monthly: { amount: 14400, interval_unit: 'monthly', interval: 1, name: 'Certigestion — Abonnement mensuel' },
      yearly:  { amount: 144000, interval_unit: 'yearly',  interval: 1, name: 'Certigestion — Abonnement annuel'  }
    };

    const selectedPlan = planConfig[plan] || planConfig.monthly;

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
          links: { mandate: mandateId }
        }
      })
    });

    if (!subscriptionRes.ok) {
      const errData = await subscriptionRes.json();
      console.error('GoCardless create subscription error:', errData);
      return new Response(
        JSON.stringify({ error: 'Échec de la création de l\'abonnement GoCardless', details: errData }),
        { status: subscriptionRes.status, headers: corsHeaders }
      );
    }

    const subscriptionData = await subscriptionRes.json();
    const gcSubscriptionId = subscriptionData.subscriptions.id;

    // ── Step 3: Get plan from Supabase ────────────────────────────────────────
    const planRes = await fetch(
      `${supabaseUrl}/rest/v1/subscription_plans?name=eq.${plan}&select=id`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const plans = await planRes.json();
    const planId = plans[0]?.id;

    if (!planId) {
      return new Response(
        JSON.stringify({ error: `Plan "${plan}" introuvable en base de données` }),
        { status: 404, headers: corsHeaders }
      );
    }

    // ── Step 4: Find or create Supabase user ──────────────────────────────────
    // Search for existing user by email
    const usersRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1&filter=${encodeURIComponent(email)}`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );

    const usersData = await usersRes.json();
    let userId;
    let isNewUser = false;

    const existingUser = usersData.users?.find(u => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with email already confirmed
      const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            company,
            phone
          }
        })
      });

      if (!createUserRes.ok) {
        const errData = await createUserRes.json();
        console.error('Supabase create user error:', errData);
        return new Response(
          JSON.stringify({ error: 'Échec de la création du compte utilisateur', details: errData }),
          { status: 500, headers: corsHeaders }
        );
      }

      const newUser = await createUserRes.json();
      userId = newUser.id;
      isNewUser = true;
    }

    // ── Step 5: Create or update subscription in Supabase ────────────────────
    const startsAt = new Date().toISOString();
    const endsAt = plan === 'yearly'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const subUpsertRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        payment_provider: 'gocardless',
        external_subscription_id: gcSubscriptionId,
        external_customer_id: gcCustomerId,
        external_mandate_id: mandateId,
        billing_first_name: firstName,
        billing_last_name: lastName,
        billing_company: company || null,
        billing_tax_id: taxId || null,
        billing_email: email,
        billing_phone: phone || null,
        starts_at: startsAt,
        ends_at: endsAt,
        metadata: { redirect_flow_id, source: 'checkout' }
      })
    });

    if (!subUpsertRes.ok) {
      const errData = await subUpsertRes.json();
      console.error('Supabase upsert subscription error:', errData);
      // Non-blocking: continue to generate magic link anyway
    }

    // ── Step 6: Generate Supabase magic link for auto-login ───────────────────
    const magicLinkRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}/generate_link`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'magiclink',
          email,
          options: {
            redirect_to: `${appUrl}/dashboard`
          }
        })
      }
    );

    if (!magicLinkRes.ok) {
      const errData = await magicLinkRes.json();
      console.error('Supabase magic link error:', errData);
      // Fallback: return success without magic link, user will login manually
      return new Response(
        JSON.stringify({
          success: true,
          auto_login: false,
          is_new_user: isNewUser,
          message: 'Abonnement créé. Connectez-vous manuellement.'
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const magicLinkData = await magicLinkRes.json();
    const magicLinkUrl = magicLinkData.hashed_token
      ? `${supabaseUrl}/auth/v1/verify?token=${magicLinkData.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${appUrl}/dashboard`)}`
      : magicLinkData.action_link;

    return new Response(
      JSON.stringify({
        success: true,
        auto_login: true,
        is_new_user: isNewUser,
        magic_link_url: magicLinkUrl,
        user_id: userId
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('complete-gocardless-checkout error:', err);
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
