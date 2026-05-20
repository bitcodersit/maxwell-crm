-- AlterTable
ALTER TABLE `properties` ADD COLUMN `purchaseTypeId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_purchaseTypeId_fkey` FOREIGN KEY (`purchaseTypeId`) REFERENCES `options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
