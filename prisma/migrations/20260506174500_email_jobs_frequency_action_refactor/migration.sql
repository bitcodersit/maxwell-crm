ALTER TABLE `email_jobs`
  ADD COLUMN `toJson` JSON NULL,
  ADD COLUMN `frequency` ENUM('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL DEFAULT 'ONCE',
  ADD COLUMN `action` JSON NULL;

UPDATE `email_jobs`
SET `toJson` = JSON_ARRAY(`to`);

UPDATE `email_jobs`
SET `frequency` = CASE
  WHEN `schedule` = 'FREQUENCY' THEN 'DAILY'
  ELSE 'ONCE'
END;

UPDATE `email_jobs`
SET `action` = CASE
  WHEN `checkerKey` IS NULL THEN NULL
  ELSE JSON_OBJECT('type', `checkerKey`, 'payload', `checkerPayload`)
END;

ALTER TABLE `email_jobs`
  DROP COLUMN `to`,
  CHANGE COLUMN `toJson` `to` JSON NOT NULL,
  DROP COLUMN `schedule`,
  DROP COLUMN `frequencySeconds`,
  DROP COLUMN `checkerKey`,
  DROP COLUMN `checkerPayload`,
  CHANGE COLUMN `lastError` `message` TEXT NULL,
  CHANGE COLUMN `lastTriedAt` `failedAt` DATETIME(3) NULL;
