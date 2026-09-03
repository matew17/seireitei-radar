-- CreateFunction
CREATE OR REPLACE FUNCTION "ThreatAlert_assignment_constraint"()
RETURNS TRIGGER AS $$
DECLARE
    squad_record RECORD;
BEGIN
    IF OLD."status" IS NOT DISTINCT FROM NEW."status"
        AND OLD."squadId" IS NOT DISTINCT FROM NEW."squadId" THEN
        RETURN NEW;
    END IF;

    IF NEW."status" = 'ASSIGNED' THEN
        IF OLD."status" <> 'PENDING' OR OLD."squadId" IS NOT NULL OR NEW."squadId" IS NULL THEN
            RAISE EXCEPTION 'ThreatAlert is not pending and unassigned'
                USING ERRCODE = '23514';
        END IF;

        SELECT *
        INTO squad_record
        FROM "Squad"
        WHERE "id" = NEW."squadId"
        FOR UPDATE;

        IF NOT FOUND OR squad_record."isAvailable" IS NOT TRUE OR squad_record."maxThreatLevel" < NEW."threatLevel" THEN
            RAISE EXCEPTION 'No eligible squad available'
                USING ERRCODE = '23514';
        END IF;
    ELSIF NEW."status" = 'RESOLVED'
        AND NEW."squadId" IS NOT DISTINCT FROM OLD."squadId"
        AND OLD."status" IN ('PENDING', 'ASSIGNED') THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'ThreatAlert is not pending and unassigned'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE CONSTRAINT TRIGGER "ThreatAlert_assignment_constraint_trigger"
AFTER UPDATE OF "status", "squadId" ON "ThreatAlert"
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION "ThreatAlert_assignment_constraint"();
