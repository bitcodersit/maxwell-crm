CREATE TABLE `email_jobs` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `to` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `html` TEXT NOT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `priority` ENUM('NORMAL', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `maxAttempts` INTEGER NOT NULL DEFAULT 3,
  `lastError` TEXT NULL,
  `scheduledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `email_jobs_status_scheduledAt_idx`(`status`, `scheduledAt`),
  INDEX `email_jobs_priority_status_scheduledAt_idx`(`priority`, `status`, `scheduledAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
