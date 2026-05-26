/*
  Warnings:

  - You are about to drop the column `module` on the `boards` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `boards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `boards` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `boards_module_idx` ON `boards`;

-- DropIndex
DROP INDEX `boards_module_slug_key` ON `boards`;

-- AlterTable
ALTER TABLE `boards` DROP COLUMN `module`,
    DROP COLUMN `slug`;

-- CreateIndex
CREATE UNIQUE INDEX `boards_name_key` ON `boards`(`name`);
