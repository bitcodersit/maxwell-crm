/*
  Warnings:

  - A unique constraint covering the columns `[addressLine1,road,block]` on the table `addresses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `addresses_addressLine1_road_block_key` ON `addresses`(`addressLine1`, `road`, `block`);
