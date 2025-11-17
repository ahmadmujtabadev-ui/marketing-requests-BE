-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "platforms" TEXT[];
