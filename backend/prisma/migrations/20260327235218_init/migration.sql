/*
  Warnings:

  - You are about to drop the column `product` on the `MarketPrice` table. All the data in the column will be lost.
  - Added the required column `productId` to the `MarketPrice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MarketPrice_product_market_recordedAt_idx";

-- AlterTable
ALTER TABLE "MarketPrice" DROP COLUMN "product",
ADD COLUMN     "productId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "MarketPrice_productId_market_recordedAt_idx" ON "MarketPrice"("productId", "market", "recordedAt");

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
