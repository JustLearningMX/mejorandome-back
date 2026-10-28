-- AlterTable: agregar steps_goal a users solo si no existe (compatible MySQL 5.7+/8.x)
SET @s = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'steps_goal') > 0,
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `steps_goal` INT NOT NULL DEFAULT 10000'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- AlterTable: renombrar columnas en exercise_sessions (paso 1)
ALTER TABLE `exercise_sessions`
    RENAME COLUMN `activity_type` TO `exercise_type`,
    RENAME COLUMN `started_at` TO `occurred_at`;

-- AlterTable: modificar y agregar columnas en exercise_sessions (paso 2)
ALTER TABLE `exercise_sessions`
    MODIFY COLUMN `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `intensity` VARCHAR(32) NULL,
    ADD COLUMN `calories_burned` INT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `daily_activities`
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

