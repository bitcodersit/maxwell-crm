-- CreateEnum
ALTER TABLE `tasks`
    ADD COLUMN `targetStatus` ENUM('NEW', 'RUNNING', 'PAUSED', 'ACHIEVED', 'MISSED', 'SKIPPED', 'STOPPED', 'CANCELLED') NULL,
    ADD COLUMN `startsAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `tasks_targetStatus_idx` ON `tasks`(`targetStatus`);

-- CreateIndex
CREATE INDEX `tasks_startsAt_idx` ON `tasks`(`startsAt`);

-- CreateIndex
CREATE INDEX `tasks_kind_targetStatus_idx` ON `tasks`(`kind`, `targetStatus`);

-- Backfill targetStatus from the old task workflow statuses
UPDATE `tasks`
SET `targetStatus` = CASE `status`
    WHEN 'TODO' THEN 'NEW'
    WHEN 'IN_PROGRESS' THEN 'RUNNING'
    WHEN 'IN_REVIEW' THEN 'PAUSED'
    WHEN 'COMPLETED' THEN 'ACHIEVED'
    WHEN 'FAILED' THEN 'MISSED'
    WHEN 'CANCELLED' THEN 'SKIPPED'
    ELSE 'RUNNING'
END
WHERE `kind` = 'TARGET'
  AND `parentId` IS NOT NULL
  AND `targetStatus` IS NULL;

-- Approximate startsAt from the occurrence due date and parent frequency
UPDATE `tasks` t
INNER JOIN `task_recurrences` r ON r.taskId = t.parentId
SET t.startsAt = CASE r.frequency
    WHEN 'WEEKLY' THEN DATE_SUB(t.dueAt, INTERVAL 5 DAY)
    WHEN 'MONTHLY' THEN STR_TO_DATE(DATE_FORMAT(t.dueAt, '%Y-%m-01'), '%Y-%m-%d')
    ELSE DATE_SUB(t.dueAt, INTERVAL 6 DAY)
END
WHERE t.kind = 'TARGET'
  AND t.parentId IS NOT NULL
  AND t.dueAt IS NOT NULL
  AND t.startsAt IS NULL;
