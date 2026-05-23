/*
  Warnings:

  - You are about to drop the `visit_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `visit_users` DROP FOREIGN KEY `visit_users_userId_fkey`;

-- DropForeignKey
ALTER TABLE `visit_users` DROP FOREIGN KEY `visit_users_visitId_fkey`;

-- AlterTable
ALTER TABLE `bills` MODIFY `authorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `visits` ADD COLUMN `assignableId` INTEGER NULL,
    ADD COLUMN `authorId` INTEGER NULL;

-- DropTable
DROP TABLE `visit_users`;

-- CreateIndex
CREATE INDEX `visits_assignableId_idx` ON `visits`(`assignableId`);

-- CreateIndex
CREATE INDEX `visits_authorId_idx` ON `visits`(`authorId`);

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_assignableId_fkey` FOREIGN KEY (`assignableId`) REFERENCES `assignables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
