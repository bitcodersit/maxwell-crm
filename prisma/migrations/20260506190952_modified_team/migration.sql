-- AlterTable
ALTER TABLE `team_members` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `teams` ADD COLUMN `avatarId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_avatarId_fkey` FOREIGN KEY (`avatarId`) REFERENCES `attachments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
