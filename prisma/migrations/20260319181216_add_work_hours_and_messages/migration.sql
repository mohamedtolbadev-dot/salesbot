-- Migration: add_work_hours_and_messages
-- This migration adds work hours fields and messages to the agents table
-- Also adds serviceId and type to conversations table

-- Alter agents table (MySQL syntax without IF NOT EXISTS)
ALTER TABLE `agents` ADD COLUMN `offlineMessage` TEXT;
ALTER TABLE `agents` ADD COLUMN `postSaleMessage` TEXT;
ALTER TABLE `agents` ADD COLUMN `welcomeMessage` TEXT;
ALTER TABLE `agents` ADD COLUMN `workEnd` VARCHAR(191) DEFAULT '18:00';
ALTER TABLE `agents` ADD COLUMN `workHoursEnabled` BOOLEAN DEFAULT false;
ALTER TABLE `agents` ADD COLUMN `workStart` VARCHAR(191) DEFAULT '09:00';
ALTER TABLE `agents` ADD COLUMN `verifyToken` VARCHAR(191);
ALTER TABLE `agents` ADD COLUMN `selectedServiceId` VARCHAR(191);
ALTER TABLE `agents` ADD COLUMN `mode` VARCHAR(191) DEFAULT 'product';

-- Alter conversations table
ALTER TABLE `conversations` ADD COLUMN `serviceId` VARCHAR(191);
ALTER TABLE `conversations` ADD COLUMN `type` VARCHAR(191) DEFAULT 'product';

-- Create services table
CREATE TABLE IF NOT EXISTS `services` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `duration` INT DEFAULT 60,
    `description` TEXT,
    `images` TEXT,
    `isActive` BOOLEAN DEFAULT true,
    `questions` INT DEFAULT 0,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
