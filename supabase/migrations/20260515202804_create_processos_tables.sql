/*
  # Wagner Reguladora - Criação das tabelas principais

  ## Tabelas novas
  - `processos`: Tabela principal dos processos de sinistro com todos os campos operacionais
    - Campos de identificação: id, numero, operador, segurado, seguradora, data_abertura, status
    - Campos da Vistoria (aba 2): datas, atendimento, tacógrafo, velocidade
    - Campos do Checklist (aba 3): documentos, conformidade, itens especiais
    - Campos do Prejuízo (aba 4): valores apurados, memória de cálculo
    - Campos de Finalização (aba 5): modelo, causa, declarações
    - Campos de Acionamento (aba 6): comunicado, atendimento no local, condições
  - `historico_processo`: Entradas de auditoria ligadas a cada processo

  ## Segurança
  - RLS habilitado em ambas as tabelas
  - Políticas de acesso público temporário para demonstração (sem autenticação exigida)

  ## Notas
  1. Arrays são armazenados como text[] no Postgres
  2. Valores monetários como numeric para precisão
  3. Booleanos com DEFAULT false
  4. Campos texto com DEFAULT ''
*/

-- Tabela de processos
CREATE TABLE IF NOT EXISTS processos (
  id text PRIMARY KEY,
  numero text NOT NULL,
  operador text NOT NULL DEFAULT '',
  segurado text NOT NULL DEFAULT '',
  seguradora text NOT NULL DEFAULT '',
  data_abertura text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Em andamento',

  -- Aba 2 - Vistoria
  data_encerramento_vistoriador text NOT NULL DEFAULT '',
  data_encerramento_finalizar_central text NOT NULL DEFAULT '',
  justificativa_atraso text NOT NULL DEFAULT '',
  atendimento_vistoria text[] NOT NULL DEFAULT '{}',
  tacografo_coletado text NOT NULL DEFAULT 'nao_necessario',
  motivo_tacografo_nao_coletado text NOT NULL DEFAULT '',
  velocidade_registrada text NOT NULL DEFAULT '',
  velocidade_permitida text NOT NULL DEFAULT '',
  disco_vencido boolean NOT NULL DEFAULT false,

  -- Aba 3 - Checklist
  documentos_fotos_analisados boolean NOT NULL DEFAULT false,
  custos_aprovados boolean NOT NULL DEFAULT false,
  historico_status text NOT NULL DEFAULT '',
  salvados_lancados text NOT NULL DEFAULT '',
  vistoriador_encerrado boolean NOT NULL DEFAULT false,
  nao_conformidade boolean NOT NULL DEFAULT false,
  nao_conformidade_descricao text NOT NULL DEFAULT '',
  checklist_especial text[] NOT NULL DEFAULT '{}',
  ata_vistoria_conferida boolean NOT NULL DEFAULT false,
  planilha_prejuizo_conferida boolean NOT NULL DEFAULT false,
  planilha_prejuizo_justificativa text NOT NULL DEFAULT '',
  mercadorias_sem_info boolean NOT NULL DEFAULT false,
  limpeza_pista_sem_tratativas boolean NOT NULL DEFAULT false,
  pericia_sindicante boolean NOT NULL DEFAULT false,
  alteracao_reserva boolean NOT NULL DEFAULT false,
  vistoria_lona_assoalho text NOT NULL DEFAULT 'na',

  -- Aba 4 - Prejuízo
  prejuizo_apurado boolean NOT NULL DEFAULT false,
  motivo_prejuizo_nao_apurado text NOT NULL DEFAULT '',
  total_embarcado numeric NOT NULL DEFAULT 0,
  total_recebido numeric NOT NULL DEFAULT 0,
  total_recusado numeric NOT NULL DEFAULT 0,
  salvados_valor numeric NOT NULL DEFAULT 0,
  falta_saque numeric NOT NULL DEFAULT 0,

  -- Aba 5 - Finalizar Central
  modelo_finalizar_central text NOT NULL DEFAULT '',
  causa_evento text NOT NULL DEFAULT '',
  declaracao_motorista text NOT NULL DEFAULT '',
  bo_acidente text NOT NULL DEFAULT '',
  local_evento text NOT NULL DEFAULT '',
  disco_tacografo text NOT NULL DEFAULT '',
  parecer_velocidade text NOT NULL DEFAULT '',

  -- Aba 6 - Acionamento
  acionamento_comunicado text NOT NULL DEFAULT '',
  realizado_por text NOT NULL DEFAULT '',
  horario_acionamento text NOT NULL DEFAULT '',
  atendimento_in_loco boolean NOT NULL DEFAULT false,
  situacao_veiculo text NOT NULL DEFAULT '',
  condicoes_mercadoria text NOT NULL DEFAULT '',
  destinacao_mercadoria text NOT NULL DEFAULT '',
  descricao_atendimento text NOT NULL DEFAULT '',
  observacao_atendimento text NOT NULL DEFAULT '',
  documentos_pendentes text[] NOT NULL DEFAULT '{}',
  vistoria_final text NOT NULL DEFAULT '',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de histórico
CREATE TABLE IF NOT EXISTS historico_processo (
  id text PRIMARY KEY,
  processo_id text NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  data text NOT NULL DEFAULT '',
  hora text NOT NULL DEFAULT '',
  operador text NOT NULL DEFAULT '',
  acao text NOT NULL DEFAULT '',
  detalhes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historico_processo_id ON historico_processo(processo_id);
CREATE INDEX IF NOT EXISTS idx_processos_status ON processos(status);
CREATE INDEX IF NOT EXISTS idx_processos_operador ON processos(operador);

-- RLS
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_processo ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso aberto (app sem autenticação de usuário)
CREATE POLICY "Public read processos"
  ON processos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public insert processos"
  ON processos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public update processos"
  ON processos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete processos"
  ON processos FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public read historico"
  ON historico_processo FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public insert historico"
  ON historico_processo FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public delete historico"
  ON historico_processo FOR DELETE
  TO anon
  USING (true);
