/*
  Warnings:

  - You are about to drop the column `approverId` on the `bills` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `bills` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(15))` to `Enum(EnumId(11))`.
  - The values [CALL,VISIT,EMAIL,MESSAGE,WHATSAPP] on the enum `follow_ups_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `status` on the `follow_ups` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(10))` to `Enum(EnumId(9))`.
  - You are about to alter the column `status` on the `visits` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(13))` to `Enum(EnumId(10))`.

*/
-- DropForeignKey
ALTER TABLE `bills` DROP FOREIGN KEY `bills_approverId_fkey`;

-- DropForeignKey
ALTER TABLE `bills` DROP FOREIGN KEY `bills_authorId_fkey`;

-- DropIndex
DROP INDEX `bills_approverId_idx` ON `bills`;

-- AlterTable
ALTER TABLE `bills` DROP COLUMN `approverId`,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewerId` INTEGER NULL,
    MODIFY `status` ENUM('New', 'Pending', 'Approved', 'Cancelled', 'Rejected') NOT NULL DEFAULT 'New';

-- AlterTable
ALTER TABLE `follow_ups` MODIFY `type` ENUM('Call', 'Visit', 'Email', 'Message', 'Whatsapp') NOT NULL,
    MODIFY `status` ENUM('Pending', 'Completed', 'Rescheduled', 'Cancelled', 'Failed') NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `visits` MODIFY `status` ENUM('Pending', 'Completed', 'Rescheduled', 'Cancelled', 'No_Show') NOT NULL DEFAULT 'Pending';

-- CreateIndex
CREATE INDEX `bills_reviewerId_idx` ON `bills`(`reviewerId`);

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
