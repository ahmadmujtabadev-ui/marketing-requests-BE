-- AlterTable
ALTER TABLE "users" ADD COLUMN     "about" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "website" TEXT;
