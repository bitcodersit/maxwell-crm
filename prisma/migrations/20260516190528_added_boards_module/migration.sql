-- CreateTable
CREATE TABLE `boards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module` ENUM('LEADS', 'TASKS') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `boards_module_idx`(`module`),
    UNIQUE INDEX `boards_module_slug_key`(`module`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_columns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `boardId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(32) NULL,
    `sortOrder` VARCHAR(64) NOT NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `board_columns_boardId_sortOrder_idx`(`boardId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `boardId` INTEGER NOT NULL,
    `columnId` INTEGER NOT NULL,
    `sortOrder` VARCHAR(64) NOT NULL,
    `leadId` INTEGER NULL,
    `taskId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `board_items_columnId_sortOrder_idx`(`columnId`, `sortOrder`),
    INDEX `board_items_boardId_leadId_idx`(`boardId`, `leadId`),
    INDEX `board_items_boardId_taskId_idx`(`boardId`, `taskId`),
    UNIQUE INDEX `board_items_boardId_leadId_key`(`boardId`, `leadId`),
    UNIQUE INDEX `board_items_boardId_taskId_key`(`boardId`, `taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `board_columns` ADD CONSTRAINT `board_columns_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `boards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `board_items` ADD CONSTRAINT `board_items_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `boards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `board_items` ADD CONSTRAINT `board_items_columnId_fkey` FOREIGN KEY (`columnId`) REFERENCES `board_columns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `board_items` ADD CONSTRAINT `board_items_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
