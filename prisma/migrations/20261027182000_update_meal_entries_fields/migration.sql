-- AlterTable
ALTER TABLE `meal_entries`
    DROP COLUMN `initial_portion`,
    DROP COLUMN `urge_to_repeat`,
    DROP COLUMN `waited_10_minutes`,
    DROP COLUMN `repeated`,
    DROP COLUMN `additional_portion`,
    DROP COLUMN `feeling_before_repeat`,
    DROP COLUMN `pause_activity`,
    ADD COLUMN `wanted_more_even_if_full` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `paused_before_more` BOOLEAN NULL,
    ADD COLUMN `extra_eating_context` TEXT NULL;
