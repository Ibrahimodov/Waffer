-- Add user_type column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'customer';

-- Add comment to describe the column
COMMENT ON COLUMN public.users.user_type IS 'Type of user: customer, shop_owner, admin';

-- Update existing users to have customer type if null
UPDATE public.users SET user_type = 'customer' WHERE user_type IS NULL;