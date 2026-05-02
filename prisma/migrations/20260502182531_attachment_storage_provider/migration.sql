-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatarId` INTEGER NULL;

-- CreateTable
CREATE TABLE `attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `storageProvider` ENUM('FILESYSTEM', 'S3', 'SUPABASE') NOT NULL DEFAULT 'FILESYSTEM',
    `bucket` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `path` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `mime` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `attachments_path_idx`(`path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_avatarId_fkey` FOREIGN KEY (`avatarId`) REFERENCES `attachments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
