ALTER TABLE `users`
ADD COLUMN `phone` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);
