-- AlterTable
ALTER TABLE `team_members` ADD COLUMN `assignerId` INTEGER NULL;

-- AlterTable
ALTER TABLE `teams` ADD COLUMN `creatorId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `team_members_assignerId_idx` ON `team_members`(`assignerId`);

-- CreateIndex
CREATE INDEX `teams_creatorId_idx` ON `teams`(`creatorId`);

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_assignerId_fkey` FOREIGN KEY (`assignerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
