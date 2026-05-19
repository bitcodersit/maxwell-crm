/*
  Warnings:

  - A unique constraint covering the columns `[module,name]` on the table `boards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `module` to the `boards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `boards_name_key` ON `boards`;

-- AlterTable
ALTER TABLE `board_columns` ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `boards` ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `module` ENUM('LEADS', 'TASKS') NOT NULL;

-- CreateIndex
CREATE INDEX `boards_module_idx` ON `boards`(`module`);

-- CreateIndex
CREATE INDEX `boards_name_idx` ON `boards`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `boards_module_name_key` ON `boards`(`module`, `name`);
