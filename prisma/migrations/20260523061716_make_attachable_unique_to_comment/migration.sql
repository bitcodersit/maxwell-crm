/*
  Warnings:

  - A unique constraint covering the columns `[attachableId]` on the table `comments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `comments_attachableId_key` ON `comments`(`attachableId`);
