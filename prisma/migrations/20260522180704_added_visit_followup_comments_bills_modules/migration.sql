/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `attachables` table. All the data in the column will be lost.
  - You are about to drop the column `leadId` on the `attachables` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `attachables` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `attachables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[attachableId]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commentableId]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attachableId]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attachableId]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[addressableId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `attachables` DROP FOREIGN KEY `attachables_attachmentId_fkey`;

-- DropForeignKey
ALTER TABLE `attachables` DROP FOREIGN KEY `attachables_leadId_fkey`;

-- DropForeignKey
ALTER TABLE `attachables` DROP FOREIGN KEY `attachables_propertyId_fkey`;

-- DropForeignKey
ALTER TABLE `attachables` DROP FOREIGN KEY `attachables_taskId_fkey`;

-- DropIndex
DROP INDEX `attachables_attachmentId_leadId_key` ON `attachables`;

-- DropIndex
DROP INDEX `attachables_attachmentId_propertyId_key` ON `attachables`;

-- DropIndex
DROP INDEX `attachables_attachmentId_taskId_key` ON `attachables`;

-- DropIndex
DROP INDEX `attachables_leadId_idx` ON `attachables`;

-- DropIndex
DROP INDEX `attachables_propertyId_idx` ON `attachables`;

-- DropIndex
DROP INDEX `attachables_taskId_idx` ON `attachables`;

-- AlterTable
ALTER TABLE `addresses` ADD COLUMN `addressableId` INTEGER NULL;

-- AlterTable
ALTER TABLE `attachables` DROP COLUMN `attachmentId`,
    DROP COLUMN `leadId`,
    DROP COLUMN `propertyId`,
    DROP COLUMN `taskId`;

-- AlterTable
ALTER TABLE `attachments` ADD COLUMN `attachableId` INTEGER NULL;

-- AlterTable
ALTER TABLE `leads` ADD COLUMN `attachableId` INTEGER NULL,
    ADD COLUMN `commentableId` INTEGER NULL;

-- AlterTable
ALTER TABLE `options` MODIFY `type` ENUM('SIZE', 'SOURCE', 'BILL_TYPE', 'PROPERTY_TYPE_SUB', 'PROPERTY_TYPE_MAIN', 'PROPERTY_PURCHASE_TYPE') NOT NULL;

-- AlterTable
ALTER TABLE `properties` ADD COLUMN `attachableId` INTEGER NULL;

-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `attachableId` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `addressableId` INTEGER NULL,
    ADD COLUMN `designation` VARCHAR(191) NULL,
    ADD COLUMN `organization` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `commentables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentableId` INTEGER NULL,
    `attachableId` INTEGER NULL,
    `authorId` INTEGER NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `comments_commentableId_createdAt_idx`(`commentableId`, `createdAt`),
    INDEX `comments_attachableId_idx`(`attachableId`),
    INDEX `comments_authorId_createdAt_idx`(`authorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follow_ups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` ENUM('CALL', 'VISIT', 'EMAIL', 'MESSAGE', 'WHATSAPP') NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `outcome` TEXT NULL,
    `nextDate` DATETIME(3) NULL,
    `attachableId` INTEGER NULL,
    `commentableId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `follow_ups_attachableId_key`(`attachableId`),
    UNIQUE INDEX `follow_ups_commentableId_key`(`commentableId`),
    INDEX `follow_ups_leadId_date_idx`(`leadId`, `date`),
    INDEX `follow_ups_type_idx`(`type`),
    INDEX `follow_ups_status_idx`(`status`),
    INDEX `follow_ups_nextDate_idx`(`nextDate`),
    INDEX `follow_ups_attachableId_idx`(`attachableId`),
    INDEX `follow_ups_commentableId_idx`(`commentableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NULL,
    `propertyId` INTEGER NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
    `checkIn` JSON NULL,
    `nextAction` TEXT NULL,
    `customerPresence` TEXT NULL,
    `attachableId` INTEGER NULL,
    `commentableId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `visits_attachableId_key`(`attachableId`),
    UNIQUE INDEX `visits_commentableId_key`(`commentableId`),
    INDEX `visits_leadId_date_idx`(`leadId`, `date`),
    INDEX `visits_propertyId_date_idx`(`propertyId`, `date`),
    INDEX `visits_status_idx`(`status`),
    INDEX `visits_attachableId_idx`(`attachableId`),
    INDEX `visits_commentableId_idx`(`commentableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `visit_users_visitId_idx`(`visitId`),
    INDEX `visit_users_userId_idx`(`userId`),
    UNIQUE INDEX `visit_users_visitId_userId_key`(`visitId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `approverId` INTEGER NULL,
    `typeId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `purpose` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `bills_userId_date_idx`(`userId`, `date`),
    INDEX `bills_authorId_date_idx`(`authorId`, `date`),
    INDEX `bills_approverId_idx`(`approverId`),
    INDEX `bills_typeId_idx`(`typeId`),
    INDEX `bills_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addressables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `addresses_addressableId_idx` ON `addresses`(`addressableId`);

-- CreateIndex
CREATE INDEX `attachments_attachableId_idx` ON `attachments`(`attachableId`);

-- CreateIndex
CREATE UNIQUE INDEX `leads_attachableId_key` ON `leads`(`attachableId`);

-- CreateIndex
CREATE UNIQUE INDEX `leads_commentableId_key` ON `leads`(`commentableId`);

-- CreateIndex
CREATE INDEX `leads_attachableId_idx` ON `leads`(`attachableId`);

-- CreateIndex
CREATE INDEX `leads_commentableId_idx` ON `leads`(`commentableId`);

-- CreateIndex
CREATE UNIQUE INDEX `properties_attachableId_key` ON `properties`(`attachableId`);

-- CreateIndex
CREATE INDEX `properties_attachableId_idx` ON `properties`(`attachableId`);

-- CreateIndex
CREATE UNIQUE INDEX `tasks_attachableId_key` ON `tasks`(`attachableId`);

-- CreateIndex
CREATE INDEX `tasks_attachableId_idx` ON `tasks`(`attachableId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_addressableId_key` ON `users`(`addressableId`);

-- CreateIndex
CREATE INDEX `users_addressableId_idx` ON `users`(`addressableId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_addressableId_fkey` FOREIGN KEY (`addressableId`) REFERENCES `addressables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_commentableId_fkey` FOREIGN KEY (`commentableId`) REFERENCES `commentables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_commentableId_fkey` FOREIGN KEY (`commentableId`) REFERENCES `commentables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow_ups` ADD CONSTRAINT `follow_ups_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow_ups` ADD CONSTRAINT `follow_ups_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow_ups` ADD CONSTRAINT `follow_ups_commentableId_fkey` FOREIGN KEY (`commentableId`) REFERENCES `commentables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_commentableId_fkey` FOREIGN KEY (`commentableId`) REFERENCES `commentables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_users` ADD CONSTRAINT `visit_users_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_users` ADD CONSTRAINT `visit_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `options`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_attachableId_fkey` FOREIGN KEY (`attachableId`) REFERENCES `attachables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_addressableId_fkey` FOREIGN KEY (`addressableId`) REFERENCES `addressables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
