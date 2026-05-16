/*
  # Add missing columns to processos table

  1. New Columns
    - `documentos_fotos_recebidos` (boolean) - tracks if documents/photos were received
    - `dispersao_saque` (numeric) - dispersion/theft value for loss calculation

  2. Notes
    - These columns align the database with the application's Processo type in data.ts
    - Both columns use safe defaults (false / 0)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processos' AND column_name = 'documentos_fotos_recebidos'
  ) THEN
    ALTER TABLE processos ADD COLUMN documentos_fotos_recebidos boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processos' AND column_name = 'dispersao_saque'
  ) THEN
    ALTER TABLE processos ADD COLUMN dispersao_saque numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
