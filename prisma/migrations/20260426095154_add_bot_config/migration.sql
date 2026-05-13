-- CreateEnum
CREATE TYPE "BotMode" AS ENUM ('DEDICATED', 'SHARED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowed" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "bot_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "mode" "BotMode" NOT NULL DEFAULT 'DEDICATED',
    "sharedSource" TEXT,

    CONSTRAINT "bot_config_pkey" PRIMARY KEY ("id")
);
