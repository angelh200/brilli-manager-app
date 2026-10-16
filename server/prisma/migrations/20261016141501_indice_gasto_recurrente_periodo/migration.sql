-- This is an empty migration.
CREATE UNIQUE INDEX "gasto_recurrente_periodo_unico"
ON "Gasto" ("recurrenteId", "periodo")
WHERE "anulado" = false AND "recurrenteId" IS NOT NULL;