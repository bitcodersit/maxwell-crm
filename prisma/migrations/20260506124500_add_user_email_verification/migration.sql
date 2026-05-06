-- AlterTable
ALTER TABLE `users`
  ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `tokens` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `modelId` INTEGER NOT NULL,
  `modelType` ENUM('USER') NOT NULL,
  `type` ENUM('VERIFY', 'RESET', 'OTP') NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `tokens_token_key`(`token`),
  INDEX `tokens_modelId_modelType_type_idx`(`modelId`, `modelType`, `type`),
  INDEX `tokens_type_idx`(`type`),
  INDEX `tokens_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
