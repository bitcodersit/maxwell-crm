/*
  Warnings:

  - A unique constraint covering the columns `[attachmentId,leadId]` on the table `attachables` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attachmentId,propertyId]` on the table `attachables` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `attachables` ADD COLUMN `leadId` INTEGER NULL,
    ADD COLUMN `propertyId` INTEGER NULL;

-- CreateTable
CREATE TABLE `options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('SOURCE', 'PROPERTY_TYPE_MAIN', 'PROPERTY_TYPE_SUB', 'SIZE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `options_type_idx`(`type`),
    INDEX `options_name_idx`(`name`),
    UNIQUE INDEX `options_name_type_key`(`name`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sid` VARCHAR(32) NOT NULL,
    `status` ENUM('New', 'Hot', 'Warm', 'Cold', 'Not_Interested', 'Closed') NOT NULL DEFAULT 'New',
    `budgetMin` DECIMAL(18, 2) NULL,
    `budgetMax` DECIMAL(18, 2) NULL,
    `creatorId` INTEGER NULL,
    `assignableId` INTEGER NULL,
    `addressId` INTEGER NULL,
    `sourceId` INTEGER NULL,
    `customerId` INTEGER NULL,
    `propertyTypeMainId` INTEGER NULL,
    `propertyTypeSubId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `leads_sid_key`(`sid`),
    INDEX `leads_customerId_idx`(`customerId`),
    INDEX `leads_creatorId_idx`(`creatorId`),
    INDEX `leads_assignableId_idx`(`assignableId`),
    INDEX `leads_addressId_idx`(`addressId`),
    INDEX `leads_sourceId_idx`(`sourceId`),
    INDEX `leads_propertyTypeMainId_idx`(`propertyTypeMainId`),
    INDEX `leads_propertyTypeSubId_idx`(`propertyTypeSubId`),
    INDEX `leads_status_idx`(`status`),
    INDEX `leads_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sid` VARCHAR(32) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('Available', 'Hold', 'Sold') NOT NULL DEFAULT 'Available',
    `creatorId` INTEGER NULL,
    `assignableId` INTEGER NULL,
    `addressId` INTEGER NULL,
    `facing` VARCHAR(191) NULL,
    `price` DECIMAL(18, 2) NULL,
    `previousPrice` DECIMAL(18, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `properties_sid_key`(`sid`),
    INDEX `properties_status_idx`(`status`),
    INDEX `properties_creatorId_idx`(`creatorId`),
    INDEX `properties_assignableId_idx`(`assignableId`),
    INDEX `properties_addressId_idx`(`addressId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property_sizes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `sizeId` INTEGER NULL,
    `sizeValue` DECIMAL(12, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `propertyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lead_properties_leadId_idx`(`leadId`),
    INDEX `lead_properties_propertyId_idx`(`propertyId`),
    UNIQUE INDEX `lead_properties_leadId_propertyId_key`(`leadId`, `propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `addressLine1` VARCHAR(191) NOT NULL,
    `road` VARCHAR(191) NULL,
    `block` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `addresses_addressLine1_idx`(`addressLine1`),
    INDEX `addresses_name_idx`(`name`),
    INDEX `addresses_road_idx`(`road`),
    INDEX `addresses_block_idx`(`block`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignable_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignableId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `assignerId` INTEGER NULL,

    INDEX `assignable_users_assignableId_idx`(`assignableId`),
    INDEX `assignable_users_userId_idx`(`userId`),
    INDEX `assignable_users_assignerId_idx`(`assignerId`),
    UNIQUE INDEX `assignable_users_assignableId_userId_key`(`assignableId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignable_teams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignableId` INTEGER NOT NULL,
    `teamId` INTEGER NOT NULL,
    `assignerId` INTEGER NULL,

    INDEX `assignable_teams_assignableId_idx`(`assignableId`),
    INDEX `assignable_teams_teamId_idx`(`teamId`),
    INDEX `assignable_teams_assignerId_idx`(`assignerId`),
    UNIQUE INDEX `assignable_teams_assignableId_teamId_key`(`assignableId`, `teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attachables_leadId_idx` ON `attachables`(`leadId`);

-- CreateIndex
CREATE INDEX `attachables_propertyId_idx` ON `attachables`(`propertyId`);

-- CreateIndex
CREATE UNIQUE INDEX `attachables_attachmentId_leadId_key` ON `attachables`(`attachmentId`, `leadId`);

-- CreateIndex
CREATE UNIQUE INDEX `attachables_attachmentId_propertyId_key` ON `attachables`(`attachmentId`, `propertyId`);

-- AddForeignKey
ALTER TABLE `attachables` ADD CONSTRAINT `attachables_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachables` ADD CONSTRAINT `attachables_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `board_items` ADD CONSTRAINT `board_items_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assignableId_fkey` FOREIGN KEY (`assignableId`) REFERENCES `assignables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `addresses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_propertyTypeMainId_fkey` FOREIGN KEY (`propertyTypeMainId`) REFERENCES `options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_propertyTypeSubId_fkey` FOREIGN KEY (`propertyTypeSubId`) REFERENCES `options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_assignableId_fkey` FOREIGN KEY (`assignableId`) REFERENCES `assignables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `addresses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_sizes` ADD CONSTRAINT `property_sizes_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_sizes` ADD CONSTRAINT `property_sizes_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_properties` ADD CONSTRAINT `lead_properties_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_properties` ADD CONSTRAINT `lead_properties_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignable_users` ADD CONSTRAINT `assignable_users_assignableId_fkey` FOREIGN KEY (`assignableId`) REFERENCES `assignables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignable_users` ADD CONSTRAINT `assignable_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignable_users` ADD CONSTRAINT `assignable_users_assignerId_fkey` FOREIGN KEY (`assignerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignable_teams` ADD CONSTRAINT `assignable_teams_assignableId_fkey` FOREIGN KEY (`assignableId`) REFERENCES `assignables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignable_teams` ADD CONSTRAINT `assignable_teams_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignable_teams` ADD CONSTRAINT `assignable_teams_assignerId_fkey` FOREIGN KEY (`assignerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
