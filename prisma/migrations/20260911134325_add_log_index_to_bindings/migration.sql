-- Add columns with default
ALTER TABLE "service_pair" 
ADD COLUMN "from_log_index" INT NOT NULL DEFAULT 0,
ADD COLUMN "to_log_index" INT;

-- Drop default
ALTER TABLE "service_pair" ALTER COLUMN "from_log_index" DROP DEFAULT;

-- Change primary key constraint
ALTER TABLE "service_pair" DROP CONSTRAINT "service_pair_pkey",
ADD CONSTRAINT "service_pair_pkey" PRIMARY KEY ("payer", "operator", "from_epoch", "from_log_index");