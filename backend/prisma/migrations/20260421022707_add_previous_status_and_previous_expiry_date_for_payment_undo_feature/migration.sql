-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "previousExpiryDate" TIMESTAMP(3),
ADD COLUMN     "previousStatus" TEXT;
