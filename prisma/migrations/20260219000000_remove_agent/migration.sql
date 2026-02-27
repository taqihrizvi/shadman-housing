-- Drop agentId from Inventory (drop FK first, then column)
ALTER TABLE "Inventory" DROP CONSTRAINT IF EXISTS "Inventory_agentId_fkey";
ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "agentId";

-- Remove AGENT from UserRole enum: migrate existing AGENT users to MANAGER, then update enum
UPDATE "User" SET "role" = 'MANAGER' WHERE "role" = 'AGENT';

CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MANAGER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MANAGER';
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
