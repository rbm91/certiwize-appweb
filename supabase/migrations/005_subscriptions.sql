-- Create/update subscriptions table for GoCardless integration
-- IDEMPOTENT : safe to re-run

-- Creer la table si elle n'existe pas du tout
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter les colonnes GoCardless si elles manquent (table existante)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS gocardless_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS gocardless_customer_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS gocardless_mandate_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS interval TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Contrainte UNIQUE conditionnelle sur gocardless_subscription_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_gocardless_subscription_id_key') THEN
    -- Ne pas ajouter la contrainte UNIQUE si des NULL existent
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE gocardless_subscription_id IS NULL) THEN
      ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_gocardless_subscription_id_key UNIQUE (gocardless_subscription_id);
    END IF;
  END IF;
END $$;

-- Contrainte UNIQUE conditionnelle sur user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_subscription') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access" ON public.subscriptions;
CREATE POLICY "Service role has full access"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Index conditionnel sur gocardless_subscription_id (peut etre NULL)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscriptions_gocardless_subscription_id') THEN
    CREATE INDEX idx_subscriptions_gocardless_subscription_id ON public.subscriptions(gocardless_subscription_id);
  END IF;
END $$;

-- Trigger
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscriptions_updated_at();

COMMENT ON TABLE public.subscriptions IS 'GoCardless subscription data for users';
