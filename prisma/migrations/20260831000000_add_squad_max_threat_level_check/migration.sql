-- AlterTable
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_maxThreatLevel_check" CHECK ("maxThreatLevel" IN (1, 2, 3));
