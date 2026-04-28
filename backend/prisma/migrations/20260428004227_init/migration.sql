/*
  Warnings:

  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
