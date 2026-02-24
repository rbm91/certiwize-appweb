/**
 * GoCardless API Client Utilities
 */

const GOCARDLESS_ACCESS_TOKEN = Deno.env.get('GOCARDLESS_ACCESS_TOKEN');
const GOCARDLESS_ENVIRONMENT = Deno.env.get('GOCARDLESS_ENVIRONMENT') || 'sandbox';

const GOCARDLESS_API_BASE = GOCARDLESS_ENVIRONMENT === 'live'
  ? 'https://api.gocardless.com'
  : 'https://api-sandbox.gocardless.com';

const GOCARDLESS_API_VERSION = '2015-07-06';

interface GoCardlessHeaders {
  'Authorization': string;
  'GoCardless-Version': string;
  'Content-Type': string;
}

function getHeaders(): GoCardlessHeaders {
  if (!GOCARDLESS_ACCESS_TOKEN) {
    throw new Error('GOCARDLESS_ACCESS_TOKEN is not configured');
  }
  return {
    'Authorization': `Bearer ${GOCARDLESS_ACCESS_TOKEN}`,
    'GoCardless-Version': GOCARDLESS_API_VERSION,
    'Content-Type': 'application/json',
  };
}

export interface CreateRedirectFlowParams {
  sessionToken: string;
  successRedirectUrl: string;
  description: string;
  prefillEmail?: string;
  prefillGivenName?: string;
  prefillFamilyName?: string;
}

export interface RedirectFlow {
  id: string;
  redirect_url: string;
  session_token: string;
}

export interface CompleteRedirectFlowResult {
  id: string;
  links: {
    customer: string;
    mandate: string;
  };
}

export interface Customer {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  company_name?: string;
}

export interface Subscription {
  id: string;
  amount: number;
  currency: string;
  status: string;
  start_date: string;
  interval_unit: string;
  interval: number;
  links: {
    mandate: string;
  };
}

/**
 * Create a GoCardless redirect flow
 */
export async function createRedirectFlow(
  params: CreateRedirectFlowParams
): Promise<RedirectFlow> {
  const response = await fetch(`${GOCARDLESS_API_BASE}/redirect_flows`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      redirect_flows: {
        session_token: params.sessionToken,
        success_redirect_url: params.successRedirectUrl,
        description: params.description,
        prefilled_customer: {
          email: params.prefillEmail,
          given_name: params.prefillGivenName,
          family_name: params.prefillFamilyName,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('GoCardless createRedirectFlow error:', error);
    throw new Error(error.error?.message || 'Failed to create redirect flow');
  }

  const data = await response.json();
  return data.redirect_flows;
}

/**
 * Complete a GoCardless redirect flow
 */
export async function completeRedirectFlow(
  redirectFlowId: string,
  sessionToken: string
): Promise<CompleteRedirectFlowResult> {
  const response = await fetch(
    `${GOCARDLESS_API_BASE}/redirect_flows/${redirectFlowId}/actions/complete`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        data: {
          session_token: sessionToken,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('GoCardless completeRedirectFlow error:', error);
    throw new Error(error.error?.message || 'Failed to complete redirect flow');
  }

  const data = await response.json();
  return data.redirect_flows;
}

/**
 * Get a GoCardless customer
 */
export async function getCustomer(customerId: string): Promise<Customer> {
  const response = await fetch(`${GOCARDLESS_API_BASE}/customers/${customerId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('GoCardless getCustomer error:', error);
    throw new Error(error.error?.message || 'Failed to get customer');
  }

  const data = await response.json();
  return data.customers;
}

/**
 * Create a GoCardless subscription
 */
export async function createSubscription(
  mandateId: string,
  amount: number,
  currency: string,
  interval: number,
  intervalUnit: 'monthly' | 'yearly',
  name: string,
  metadata?: Record<string, string>
): Promise<Subscription> {
  const response = await fetch(`${GOCARDLESS_API_BASE}/subscriptions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      subscriptions: {
        amount,
        currency,
        name,
        interval,
        interval_unit: intervalUnit,
        metadata: metadata || {},
        links: {
          mandate: mandateId,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('GoCardless createSubscription error:', error);
    throw new Error(error.error?.message || 'Failed to create subscription');
  }

  const data = await response.json();
  return data.subscriptions;
}
