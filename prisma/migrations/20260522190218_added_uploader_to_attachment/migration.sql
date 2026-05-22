-- AlterTable
ALTER TABLE `attachments` ADD COLUMN `uploaderId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
