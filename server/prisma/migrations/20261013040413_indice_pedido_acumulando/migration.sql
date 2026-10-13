-- This is an empty migration.
CREATE UNIQUE INDEX "pedido_unico_acumulando"
ON "Pedido" ("clienteId")
WHERE "estado" = 'acumulando';