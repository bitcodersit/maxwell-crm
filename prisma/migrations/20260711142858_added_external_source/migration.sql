/*
  Warnings:

  - A unique constraint covering the columns `[externalSource,externalId]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `leads` ADD COLUMN `externalId` VARCHAR(128) NULL,
    ADD COLUMN `externalSource` VARCHAR(32) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `leads_externalSource_externalId_key` ON `leads`(`externalSource`, `externalId`);
