-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "anuladaEn" TIMESTAMP(3),
ADD COLUMN     "motivoAnulacion" TEXT;

-- AlterTable
ALTER TABLE "MovimientoCaja" ADD COLUMN     "anulado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "anuladoEn" TIMESTAMP(3),
ADD COLUMN     "motivoAnulacion" TEXT;
