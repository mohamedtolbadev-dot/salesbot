/*
  Warnings:

  - The values [PRODUCT_BUYER,SERVICE_USER,BOTH] on the enum `customers_tag` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `customers` MODIFY `tag` ENUM('NEW', 'REGULAR', 'VIP', 'PROSPECT') NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `serviceName` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `reminderSent` BOOLEAN NOT NULL DEFAULT false,
    `confirmationSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `appointments_userId_date_idx`(`userId`, `date`),
    INDEX `appointments_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
