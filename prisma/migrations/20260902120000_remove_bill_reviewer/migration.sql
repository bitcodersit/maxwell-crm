-- DropForeignKey
ALTER TABLE `bills` DROP FOREIGN KEY `bills_reviewerId_fkey`;

-- DropIndex
DROP INDEX `bills_reviewerId_idx` ON `bills`;

-- AlterTable
ALTER TABLE `bills` DROP COLUMN `reviewerId`;
