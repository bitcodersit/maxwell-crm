/*
  Warnings:

  - You are about to drop the column `bucket` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `storageProvider` on the `attachments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `attachments` DROP COLUMN `bucket`,
    DROP COLUMN `storageProvider`,
    ADD COLUMN `provider` ENUM('FILESYSTEM', 'S3', 'SUPABASE') NOT NULL DEFAULT 'FILESYSTEM';
