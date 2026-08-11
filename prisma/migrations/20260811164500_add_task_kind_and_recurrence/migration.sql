-- CreateTable
CREATE TABLE `task_recurrences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `frequency` ENUM('WEEKLY', 'MONTHLY', 'CUSTOM') NOT NULL,
    `intervalDays` INTEGER NULL,
    `rangeStart` DATETIME(3) NOT NULL,
    `rangeEnd` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `task_recurrences_taskId_key`(`taskId`),
    INDEX `task_recurrences_nextRunAt_idx`(`nextRunAt`),
    INDEX `task_recurrences_frequency_idx`(`frequency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `kind` ENUM('TASK', 'TARGET') NOT NULL DEFAULT 'TASK',
    ADD COLUMN `parentId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `tasks_kind_dueAt_idx` ON `tasks`(`kind`, `dueAt`);

-- CreateIndex
CREATE INDEX `tasks_parentId_idx` ON `tasks`(`parentId`);

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_recurrences` ADD CONSTRAINT `task_recurrences_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
