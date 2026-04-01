-- AlterTable
ALTER TABLE `agents` ADD COLUMN `orderConfirmMessage` TEXT NULL,
    ADD COLUMN `orderDeliverMessage` TEXT NULL,
    ADD COLUMN `orderShipMessage` TEXT NULL;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `confirmSent` BOOLEAN NOT NULL DEFAULT false,
    `shipSent` BOOLEAN NOT NULL DEFAULT false,
    `deliverSent` BOOLEAN NOT NULL DEFAULT false,
    `trackingNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `orders_userId_status_idx`(`userId`, `status`),
    INDEX `orders_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
