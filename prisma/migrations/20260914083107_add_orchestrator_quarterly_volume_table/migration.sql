-- CreateTable
CREATE TABLE "service_orchestrator_quarterly_volume" (
    "service_orchestrator_id" TEXT NOT NULL,
    "quarter_num" INTEGER NOT NULL,
    "volume_atto_usd" DECIMAL(65,30) NOT NULL,
    "is_correction" BOOLEAN NOT NULL,
    "posting_epoch" BIGINT NOT NULL,
    "posting_log_index" INTEGER NOT NULL,
    "posting_tx_hash" TEXT NOT NULL,

    CONSTRAINT "service_orchestrator_quarterly_volume_pkey" PRIMARY KEY ("service_orchestrator_id","quarter_num","posting_epoch","posting_log_index")
);
