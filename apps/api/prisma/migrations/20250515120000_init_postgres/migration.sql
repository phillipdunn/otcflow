-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BROKER', 'TRADER', 'SUPERVISOR', 'OPERATIONS');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BOND', 'CDS', 'CDX', 'EQUITY_OPTION', 'EQUITY_SWAP', 'FX_NDF', 'FX_OPTION', 'FX_SWAP', 'IRS', 'OIS');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('NEW', 'PENDING', 'MATCHED', 'CANCELLED', 'BOOKED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GBP', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('DEAL_CREATED', 'DEAL_STATUS_CHANGED', 'DEAL_AMENDED', 'DEAL_PRICE_CHANGED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "product" "ProductType" NOT NULL,
    "counterparty" TEXT NOT NULL,
    "notional" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "price" DECIMAL(18,6) NOT NULL,
    "status" "DealStatus" NOT NULL,
    "trader" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" "AuditEventType" NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "summary" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "version" INTEGER NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_updatedAt_idx" ON "Deal"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "AuditEvent_dealId_timestamp_idx" ON "AuditEvent"("dealId", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
