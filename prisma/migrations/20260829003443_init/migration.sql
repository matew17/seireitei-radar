-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'ASSIGNED', 'RESOLVED');

-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "captainName" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxThreatLevel" INTEGER NOT NULL,
    "currentLat" DOUBLE PRECISION NOT NULL,
    "currentLng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatAlert" (
    "id" TEXT NOT NULL,
    "threatLevel" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "squadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreatAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Squad_number_key" ON "Squad"("number");

-- AddForeignKey
ALTER TABLE "ThreatAlert" ADD CONSTRAINT "ThreatAlert_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
