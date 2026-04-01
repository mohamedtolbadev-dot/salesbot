/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `workEnd` on table `agents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workHoursEnabled` on table `agents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workStart` on table `agents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mode` on table `agents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `conversations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `duration` on table `services` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isActive` on table `services` required. This step will fail if there are existing NULL values in that column.
  - Made the column `questions` on table `services` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `services` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `agents` DROP FOREIGN KEY `agents_userId_fkey`;

-- DropForeignKey
ALTER TABLE `conversations` DROP FOREIGN KEY `conversations_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `conversations` DROP FOREIGN KEY `conversations_userId_fkey`;

-- DropForeignKey
ALTER TABLE `customers` DROP FOREIGN KEY `customers_userId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey`;

-- DropForeignKey
ALTER TABLE `objection_replies` DROP FOREIGN KEY `objection_replies_agentId_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_userId_fkey`;

-- DropIndex
DROP INDEX `conversations_customerId_fkey` ON `conversations`;

-- DropIndex
DROP INDEX `conversations_userId_fkey` ON `conversations`;

-- DropIndex
DROP INDEX `messages_conversationId_fkey` ON `messages`;

-- DropIndex
DROP INDEX `notifications_userId_fkey` ON `notifications`;

-- DropIndex
DROP INDEX `objection_replies_agentId_fkey` ON `objection_replies`;

-- DropIndex
DROP INDEX `products_userId_fkey` ON `products`;

-- AlterTable
ALTER TABLE `agents` MODIFY `workEnd` VARCHAR(191) NOT NULL DEFAULT '18:00',
    MODIFY `workHoursEnabled` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `workStart` VARCHAR(191) NOT NULL DEFAULT '09:00',
    MODIFY `mode` VARCHAR(191) NOT NULL DEFAULT 'product';

-- AlterTable
ALTER TABLE `conversations` MODIFY `stage` ENUM('GREETING', 'DISCOVERY', 'PITCHING', 'OBJECTION', 'CLOSING', 'CLOSED', 'ABANDONED', 'ARCHIVED') NOT NULL DEFAULT 'GREETING',
    MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'product';

-- AlterTable
ALTER TABLE `services` MODIFY `duration` INTEGER NOT NULL DEFAULT 60,
    MODIFY `isActive` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `questions` INTEGER NOT NULL DEFAULT 0,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `users` ADD COLUMN `googleId` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `googleId` ON `users`(`googleId`);
