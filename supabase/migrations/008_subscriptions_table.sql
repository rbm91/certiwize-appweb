-- ============================================================
-- Table: subscriptions
-- Stocke les abonnements GoCardless liés aux utilisateurs
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'monthly' CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  payment_provider TEXT NOT NULL DEFAULT 'gocardless',

  -- GoCardless IDs
  external_subscription_id TEXT,
  external_customer_id TEXT,
  external_mandate_id TEXT,

  -- Montant
  amount INTEGER NOT NULL DEFAULT 0,  -- en centimes
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Billing info
  billing_first_name TEXT,
  billing_last_name TEXT,
  billing_company TEXT,
  billing_tax_id TEXT,
  billing_email TEXT,
  billing_phone TEXT,

  -- Dates
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un seul abonnement actif par utilisateur
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id ON subscriptions(external_subscription_id);

-- Updated_at trigger
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut voir son propre abonnement
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Seul le service role peut insérer/modifier (via les Edge Functions)
-- Les inserts depuis les API routes utilisent le service_role_key, pas le anon key
-- Donc pas besoin de policy INSERT/UPDATE pour les users normaux

-- Super admin peut tout voir
CREATE POLICY "subscriptions_select_admin" ON subscriptions
  FOR SELECT USING (is_super_admin());
