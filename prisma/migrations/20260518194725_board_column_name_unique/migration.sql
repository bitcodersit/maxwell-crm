/*
  Warnings:

  - A unique constraint covering the columns `[boardId,name]` on the table `board_columns` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `board_columns_boardId_name_key` ON `board_columns`(`boardId`, `name`);
