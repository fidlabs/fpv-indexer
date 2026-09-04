-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ServiceRewardsActorParameterType" AS ENUM ('MIN_LOT_ALPHA_NUMERATOR', 'MIN_LOT_ALPHA_DENOMINATOR', 'MIN_LOT_FLOOR', 'PRICE_BAND_BPS', 'REGISTRATION_CUTOFF_EPOCHS');

-- CreateTable
CREATE TABLE "application_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "activation_epoch" BIGINT NOT NULL,
    "epochs_per_quarter" BIGINT NOT NULL,

    CONSTRAINT "application_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_state" (
    "contract_address" TEXT NOT NULL,
    "end_block" BIGINT NOT NULL,
    "last_run_date" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("contract_address")
);

-- CreateTable
CREATE TABLE "service_rewards_actor_parameter" (
    "parameter_type" "ServiceRewardsActorParameterType" NOT NULL,
    "parameter_value" DECIMAL(65,30) NOT NULL,
    "update_epoch" BIGINT NOT NULL,
    "update_log_index" INTEGER NOT NULL,
    "update_tx_hash" TEXT NOT NULL,

    CONSTRAINT "service_rewards_actor_parameter_pkey" PRIMARY KEY ("parameter_type","update_epoch","update_log_index")
);

-- CreateTable
CREATE TABLE "service_orchestrator" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "registration_epoch" BIGINT NOT NULL,
    "registration_tx_hash" TEXT NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "removal_epoch" BIGINT,
    "removal_tx_hash" TEXT,

    CONSTRAINT "service_orchestrator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_pair" (
    "service_orchestrator_id" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "from_epoch" BIGINT NOT NULL,
    "to_epoch" BIGINT,
    "binding_epoch" BIGINT NOT NULL,
    "binding_tx_hash" TEXT NOT NULL,
    "unbinding_epoch" BIGINT,
    "unbinding_tx_hash" TEXT,

    CONSTRAINT "service_pair_pkey" PRIMARY KEY ("payer","operator","from_epoch")
);

-- CreateTable
CREATE TABLE "quarter_bound_volume" (
    "quarter_num" INTEGER NOT NULL,
    "volume_atto_usd" DECIMAL(65,30) NOT NULL,
    "epoch" BIGINT NOT NULL,
    "tx_hash" TEXT NOT NULL,

    CONSTRAINT "quarter_bound_volume_pkey" PRIMARY KEY ("quarter_num")
);

-- CreateTable
CREATE TABLE "whitelisted_token" (
    "token_address" TEXT NOT NULL,
    "token_decimals" INTEGER NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "admittance_epoch" BIGINT NOT NULL,
    "admittance_log_index" INTEGER NOT NULL,
    "admittance_tx_hash" TEXT NOT NULL,
    "removal_epoch" BIGINT,
    "removal_log_index" INTEGER,
    "removal_tx_hash" TEXT,

    CONSTRAINT "whitelisted_token_pkey" PRIMARY KEY ("token_address","admittance_epoch","admittance_log_index")
);

-- CreateTable
CREATE TABLE "filecoin_pay_contract" (
    "contract_address" TEXT NOT NULL,
    "admittance_epoch" BIGINT NOT NULL,
    "admittance_log_index" INTEGER NOT NULL,
    "admittance_tx_hash" TEXT NOT NULL,
    "removal_epoch" BIGINT,
    "removal_log_index" INTEGER,
    "removal_tx_hash" TEXT,

    CONSTRAINT "filecoin_pay_contract_pkey" PRIMARY KEY ("contract_address","admittance_epoch","admittance_log_index")
);

-- CreateTable
CREATE TABLE "filecoin_pay_rail" (
    "filecoin_pay_contract_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "operator" TEXT NOT NULL,
    "rail_id" DECIMAL(78,0) NOT NULL,
    "token" TEXT NOT NULL,
    "validator" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "payer" TEXT NOT NULL,

    CONSTRAINT "filecoin_pay_rail_pkey" PRIMARY KEY ("filecoin_pay_contract_address","rail_id")
);

-- CreateTable
CREATE TABLE "filecoin_pay_payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filecoin_pay_contract_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "net_payee_amount" DECIMAL(78,0) NOT NULL,
    "network_fee" DECIMAL(78,0) NOT NULL,
    "one_time" BOOLEAN NOT NULL,
    "operator_commission" DECIMAL(78,0) NOT NULL,
    "rail_id" DECIMAL(78,0) NOT NULL,
    "settled_at_epoch" BIGINT NOT NULL,
    "total_amount" DECIMAL(78,0) NOT NULL,

    CONSTRAINT "filecoin_pay_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filecoin_pay_fee_auction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filecoin_pay_contract_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "amount_actual" DECIMAL(78,0) NOT NULL,
    "fil_burned" DECIMAL(78,0) NOT NULL,
    "token_address" TEXT NOT NULL,
    "auctioned_at_epoch" BIGINT NOT NULL,

    CONSTRAINT "filecoin_pay_fee_auction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_pair_service_orchestrator_id_payer_operator_idx" ON "service_pair"("service_orchestrator_id", "payer", "operator");

-- CreateIndex
CREATE INDEX "filecoin_pay_rail_rail_id_idx" ON "filecoin_pay_rail"("rail_id");

-- CreateIndex
CREATE INDEX "filecoin_pay_rail_token_idx" ON "filecoin_pay_rail"("token");

-- CreateIndex
CREATE INDEX "filecoin_pay_rail_payer_operator_idx" ON "filecoin_pay_rail"("payer", "operator");

-- CreateIndex
CREATE INDEX "filecoin_pay_payment_filecoin_pay_contract_address_rail_id__idx" ON "filecoin_pay_payment"("filecoin_pay_contract_address", "rail_id", "settled_at_epoch");

-- AddForeignKey
ALTER TABLE "service_pair" ADD CONSTRAINT "service_pair_service_orchestrator_id_fkey" FOREIGN KEY ("service_orchestrator_id") REFERENCES "service_orchestrator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filecoin_pay_payment" ADD CONSTRAINT "filecoin_pay_payment_filecoin_pay_contract_address_rail_id_fkey" FOREIGN KEY ("filecoin_pay_contract_address", "rail_id") REFERENCES "filecoin_pay_rail"("filecoin_pay_contract_address", "rail_id") ON DELETE RESTRICT ON UPDATE CASCADE;

