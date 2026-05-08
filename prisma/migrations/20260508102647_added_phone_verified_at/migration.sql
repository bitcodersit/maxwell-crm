-- AlterTable
ALTER TABLE `users` ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `users_phone_idx` ON `users`(`phone`);
