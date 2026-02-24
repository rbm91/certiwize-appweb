import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  completeRedirectFlow,
  getCustomer,
  createSubscription,
} from '../_shared/gocardless.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  redirect_flow_id: string;
  session_token: string;
  plan: 'monthly' | 'yearly';
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  taxId?: string;
  phone?: string;
}

const PLAN_DETAILS = {
  monthly: {
    amount: 14400, // 144.00 EUR in cents
    currency: 'EUR',
    interval: 1,
    intervalUnit: 'monthly' as const,
    name: 'Certigestion - Mensuel',
  },
  yearly: {
    amount: 144000, // 1440.00 EUR in cents
    currency: 'EUR',
    interval: 1,
    intervalUnit: 'yearly' as const,
    name: 'Certigestion - Annuel',
  },
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();

    // Validate required fields
    if (!body.redirect_flow_id || !body.session_token || !body.plan || !body.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client (admin)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Complete the GoCardless redirect flow
    console.log('Completing GoCardless redirect flow...');
    const completedFlow = await completeRedirectFlow(
      body.redirect_flow_id,
      body.session_token
    );

    const customerId = completedFlow.links.customer;
    const mandateId = completedFlow.links.mandate;

    // 2. Get customer details from GoCardless
    console.log('Fetching GoCardless customer...');
    const gcCustomer = await getCustomer(customerId);

    // 3. Create subscription in GoCardless
    console.log('Creating GoCardless subscription...');
    const planDetails = PLAN_DETAILS[body.plan];
    const subscription = await createSubscription(
      mandateId,
      planDetails.amount,
      planDetails.currency,
      planDetails.interval,
      planDetails.intervalUnit,
      planDetails.name,
      {
        email: body.email,
        plan: body.plan,
      }
    );

    // 4. Create or update user in Supabase Auth
    console.log('Creating Supabase user...');
    let userId: string;

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === body.email);

    if (existingUser) {
      userId = existingUser.id;
      console.log('User already exists:', userId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
        user_metadata: {
          first_name: body.firstName,
          last_name: body.lastName,
          company: body.company,
          tax_id: body.taxId,
          phone: body.phone,
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log('New user created:', userId);
    }

    // 5. Store subscription info in your database
    // Check if subscriptions table exists, if not skip this step
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        gocardless_subscription_id: subscription.id,
        gocardless_customer_id: customerId,
        gocardless_mandate_id: mandateId,
        plan: body.plan,
        status: subscription.status,
        amount: planDetails.amount,
        currency: planDetails.currency,
        interval: planDetails.intervalUnit,
        start_date: subscription.start_date,
        next_payment_date: subscription.start_date,
      }, {
        onConflict: 'user_id',
      });

    if (subscriptionError) {
      console.warn('Could not insert subscription (table may not exist):', subscriptionError);
      // Continue anyway - the subscription is created in GoCardless
    }

    // 6. Generate magic link for auto-login
    console.log('Generating magic link...');
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: body.email,
      options: {
        redirectTo: `${APP_URL}/dashboard`,
      },
    });

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError);
      // Don't fail - user can still login manually
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        subscription_id: subscription.id,
        auto_login: !!magicLinkData,
        magic_link_url: magicLinkData?.properties?.action_link || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error completing GoCardless checkout:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
