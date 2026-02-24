import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRedirectFlow } from '../_shared/gocardless.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  plan: 'monthly' | 'yearly';
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  taxId?: string;
  phone?: string;
  sessionToken: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();

    // Validate required fields
    if (!body.plan || !body.firstName || !body.lastName || !body.email || !body.sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the success redirect URL
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const successRedirectUrl = `${APP_URL}/checkout/success`;

    // Create the GoCardless redirect flow
    const redirectFlow = await createRedirectFlow({
      sessionToken: body.sessionToken,
      successRedirectUrl,
      description: `Certigestion - Abonnement ${body.plan === 'monthly' ? 'mensuel' : 'annuel'}`,
      prefillEmail: body.email,
      prefillGivenName: body.firstName,
      prefillFamilyName: body.lastName,
    });

    return new Response(
      JSON.stringify({
        redirect_url: redirectFlow.redirect_url,
        redirect_flow_id: redirectFlow.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating GoCardless redirect flow:', error);
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
