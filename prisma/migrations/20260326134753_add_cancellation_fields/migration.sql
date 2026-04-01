-- AlterTable
ALTER TABLE `agents` ADD COLUMN `appointmentCancellationMessage` TEXT NULL;

-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `cancellationSent` BOOLEAN NOT NULL DEFAULT false;
