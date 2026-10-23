-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'America/Mexico_City',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_identities` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `provider` VARCHAR(64) NOT NULL,
    `provider_subject` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `auth_identities_provider_provider_subject_key`(`provider`, `provider_subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_days` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `local_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `health_days_user_id_idx`(`user_id`),
    UNIQUE INDEX `health_days_user_id_local_date_key`(`user_id`, `local_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weight_measurements` (
    `id` CHAR(36) NOT NULL,
    `health_day_id` CHAR(36) NOT NULL,
    `weight_kg` DECIMAL(5, 2) NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `weight_measurements_health_day_id_idx`(`health_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_entries` (
    `id` CHAR(36) NOT NULL,
    `health_day_id` CHAR(36) NOT NULL,
    `meal_type` ENUM('breakfast', 'lunch', 'dinner', 'snack', 'other') NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `initial_portion` VARCHAR(255) NULL,
    `hunger_before` TINYINT NULL,
    `satiety_after` TINYINT NULL,
    `urge_to_repeat` TINYINT NULL,
    `waited_10_minutes` BOOLEAN NULL,
    `repeated` BOOLEAN NULL,
    `additional_portion` VARCHAR(255) NULL,
    `feeling_before_repeat` TEXT NULL,
    `pause_activity` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `meal_entries_health_day_id_idx`(`health_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_sessions` (
    `id` CHAR(36) NOT NULL,
    `health_day_id` CHAR(36) NOT NULL,
    `activity_type` VARCHAR(128) NOT NULL,
    `duration_minutes` SMALLINT NOT NULL,
    `started_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exercise_sessions_health_day_id_idx`(`health_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_activities` (
    `id` CHAR(36) NOT NULL,
    `health_day_id` CHAR(36) NOT NULL,
    `steps` INTEGER NOT NULL,
    `source` VARCHAR(64) NOT NULL DEFAULT 'manual',
    `recorded_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_activities_health_day_id_key`(`health_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sleep_records` (
    `id` CHAR(36) NOT NULL,
    `health_day_id` CHAR(36) NOT NULL,
    `duration_minutes` SMALLINT NOT NULL,
    `sleep_started_at` DATETIME(3) NULL,
    `sleep_ended_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sleep_records_health_day_id_key`(`health_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_notes` (
    `id` CHAR(36) NOT NULL,
    `health_day_id` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `health_notes_health_day_id_idx`(`health_day_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth_identities` ADD CONSTRAINT `auth_identities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_days` ADD CONSTRAINT `health_days_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weight_measurements` ADD CONSTRAINT `weight_measurements_health_day_id_fkey` FOREIGN KEY (`health_day_id`) REFERENCES `health_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_entries` ADD CONSTRAINT `meal_entries_health_day_id_fkey` FOREIGN KEY (`health_day_id`) REFERENCES `health_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exercise_sessions` ADD CONSTRAINT `exercise_sessions_health_day_id_fkey` FOREIGN KEY (`health_day_id`) REFERENCES `health_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_activities` ADD CONSTRAINT `daily_activities_health_day_id_fkey` FOREIGN KEY (`health_day_id`) REFERENCES `health_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sleep_records` ADD CONSTRAINT `sleep_records_health_day_id_fkey` FOREIGN KEY (`health_day_id`) REFERENCES `health_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_notes` ADD CONSTRAINT `health_notes_health_day_id_fkey` FOREIGN KEY (`health_day_id`) REFERENCES `health_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
