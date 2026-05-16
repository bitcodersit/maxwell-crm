/*
  Warnings:

  - You are about to drop the column `completedAt` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tasks` DROP COLUMN `completedAt`,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NULL,
    ADD COLUMN `submitterId` INTEGER NULL,
    MODIFY `status` ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'FAILED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'TODO';

-- CreateIndex
CREATE INDEX `tasks_submitterId_idx` ON `tasks`(`submitterId`);

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_submitterId_fkey` FOREIGN KEY (`submitterId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
