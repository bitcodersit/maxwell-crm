ALTER TABLE `users`
ADD COLUMN `creatorId` INTEGER NULL;

CREATE INDEX `users_creatorId_idx` ON `users`(`creatorId`);

ALTER TABLE `users`
ADD CONSTRAINT `users_creatorId_fkey`
FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;
