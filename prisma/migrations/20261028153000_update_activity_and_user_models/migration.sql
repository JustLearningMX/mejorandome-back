-- AlterTable
ALTER TABLE `users` ADD COLUMN `steps_goal` INT NOT NULL DEFAULT 10000;

-- AlterTable
ALTER TABLE `exercise_sessions`
    RENAME COLUMN `activity_type` TO `exercise_type`,
    RENAME COLUMN `started_at` TO `occurred_at`,
    MODIFY COLUMN `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `intensity` VARCHAR(32) NULL,
    ADD COLUMN `calories_burned` INT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `daily_activities`
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

