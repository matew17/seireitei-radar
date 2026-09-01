-- AlterTable
ALTER TABLE "ThreatAlert" ADD CONSTRAINT "ThreatAlert_threatLevel_check" CHECK ("threatLevel" IN (1, 2, 3));
