/*
  # Create processos_controle table

  1. New Tables
    - `processos_controle`
      - `id` (uuid, primary key)
      - `numero` (text) - process number
      - `segurado` (text) - insured party
      - `seguradora` (text) - insurance company
      - `conducao` (text) - regulator first name
      - `recebimento` (text) - receipt date DD/MM/AAAA
      - `tipo_evento` (text) - event type (Atendimento/Vistoria)
      - `mercadoria` (text) - merchandise description
      - `preliminar` (text, default '') - preliminary status
      - `email` (text, default '') - email status
      - `custos` (text, default '') - costs status
      - `salvados` (text, default '') - salvage status
      - `fin_central` (text, default '') - central finalization status
      - `cobranca_docs` (text, default '') - document collection status
      - `decurso` (text, default '') - lapse status
      - `origem_pdf` (boolean, default false) - imported via AI
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `processos_controle` table
    - Add policy for anon users to perform CRUD (no auth configured)
*/

CREATE TABLE IF NOT EXISTS processos_controle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL DEFAULT '',
  segurado text NOT NULL DEFAULT '',
  seguradora text NOT NULL DEFAULT '',
  conducao text NOT NULL DEFAULT '',
  recebimento text NOT NULL DEFAULT '',
  tipo_evento text NOT NULL DEFAULT '',
  mercadoria text NOT NULL DEFAULT '',
  preliminar text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  custos text NOT NULL DEFAULT '',
  salvados text NOT NULL DEFAULT '',
  fin_central text NOT NULL DEFAULT '',
  cobranca_docs text NOT NULL DEFAULT '',
  decurso text NOT NULL DEFAULT '',
  origem_pdf boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE processos_controle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select processos_controle"
  ON processos_controle
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert processos_controle"
  ON processos_controle
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update processos_controle"
  ON processos_controle
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete processos_controle"
  ON processos_controle
  FOR DELETE
  TO anon
  USING (true);
