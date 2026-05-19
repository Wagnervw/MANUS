/*
  # Add abertura_sinistro column to processos_controle

  1. Modified Tables
    - `processos_controle`
      - `abertura_sinistro` (text, default '') - Date/time when the sinistro was opened (extracted from PDF near "Preliminar")

  2. Notes
    - This field captures the opening date of the claim notice
    - Used to calculate deadline alerts (e.g., Preliminar must be sent within 2 days)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processos_controle' AND column_name = 'abertura_sinistro'
  ) THEN
    ALTER TABLE processos_controle ADD COLUMN abertura_sinistro text NOT NULL DEFAULT '';
  END IF;
END $$;
