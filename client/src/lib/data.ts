// ============================================================
// Wagner Reguladora - Finalização Central
// Design: Corporate Precision — Azul profundo #1e40af
// Dados, tipos e constantes operacionais
// ============================================================

// ---- TIPOS ----

export interface HistoricoEntry {
  id: string;
  data: string;
  hora: string;
  operador: string;
  acao: string;
  detalhes: string;
}

export interface Processo {
  id: string;
  numero: string;
  operador: string;
  segurado: string;
  seguradora: string;
  dataAbertura: string;
  status: 'Em andamento' | 'Concluído' | 'Pendente';
  historico: HistoricoEntry[];

  // Aba 2 - Vistoria
  dataEncerramentoVistoriador: string;
  dataEncerramentoFinalizarCentral: string;
  justificativaAtraso: string;
  atendimentoVistoria: string[];
  tacografoColetado: 'sim' | 'nao' | 'nao_necessario';
  motivoTacografoNaoColetado: string;
  velocidadeRegistrada: string;
  velocidadePermitida: string;
  discoVencido: boolean;

  // Aba 3 - Checklist Operacional
  documentosFotosRecebidos: boolean;
  custosAprovados: boolean;
  historicoStatus: string;
  salvadosLancados: string;
  vistoriadorEncerrado: boolean;
  naoConformidade: boolean;
  naoConformidadeDescricao: string;
  checklistEspecial: string[];
  tratativasEmailEncerradas: boolean;
  inventarioSalvados: boolean;
  planilhaPrejuizoJustificativa: string;
  mercadoriasSemInfo: boolean;
  limpezaPistaSemTratativas: boolean;
  periciaSindicante: boolean;
  alteracaoReserva: boolean;
  lonaVeiculoInspecionados: boolean;
  furosNaLona: boolean;
  todasLonasInspecionadas: boolean;
  acionamentoSindicancia: boolean;
  documentosAssinados: boolean;
  documentosAssinadosJustificativa: string;
  mercadoriaNovaOuUsada: string;
  identificacaoAnoModelo: boolean;
  fotosEtiquetaIdentificacao: boolean;
  fotosOdometro: boolean;
  orcamentoReparo: boolean;
  custosLancados: boolean;
  custosUltrapassaramAutonomia: string;
  seguradoraNotificada: boolean;
  informacoesComplementaresLancadas: boolean;

  // Aba 4 - Prejuízo / Memória de Cálculo
  prejuizoApurado: boolean;
  motivoPrejuizoNaoApurado: string;
  totalEmbarcado: number;
  totalRecebido: number;
  totalRecusado: number;
  salvadosValor: number;
  dispersaoSaque: number;

  // Aba 5 - Finalizar Central
  modeloFinalizarCentral: string;
  causaEvento: string;
  localEvento: string;
  discoTacografo: string;
  parecerVelocidade: string;

  // Aba 6 - Acionamento / Atendimento / Providências
  acionamentoComunicado: string;
  realizadoPor: string;
  horarioAcionamento: string;
  atendimentoInLoco: boolean;
  situacaoVeiculo: string;
  condicoesMercadoria: string;
  destinacaoMercadoria: string;
  relatoMotorista: string;
  resumoAtendimento: string;
  descricaoAtendimento: string;
  observacaoAtendimento: string;
  documentosPendentes: string[];
  vistoriaFinal: string;
}

export interface Operador {
  id: string;
  nome: string;
  avatar: string;
  processosRealizados: number;
  processosConcluidos: number;
  processosEmAndamento: number;
  processosPendentes: number;
  faixa: 'bronze' | 'prata' | 'ouro' | 'diamante';
}

// ---- CONSTANTES ----

export const MEMBROS_CELULA = [
  'Amanda',
  'Natiele',
  'Lisiane',
  'Sabrina',
  'Vinícius',
];

export const SEGURADORAS = [
  'SOMPO SEGUROS S.A.',
  'CHUBB SEGUROS BRASIL S.A.',
  'HDI GLOBAL SEGUROS S.A.',
  'KOVR SEGURADORA S.A.',
  'TOKIO MARINE SEGURADORA S/A',
  'ALLIANZ SEGUROS S/A',
  'YELUM SEGUROS S.A.',
  'FAIRFAX BRASIL SEGUROS',
  'AIG SEGUROS BRASIL S/A',
  'AXA SEGUROS S/A',
  'M DIAS BRANCO S.A.',
  'CARGILL',
];

export const STATUS_PROCESSO = ['Em andamento', 'Concluído', 'Pendente'] as const;

// Aba 2
export const ATENDIMENTO_VISTORIA_ITEMS = [
  'Contato com o segurado realizado',
  'Agendamento de vistoria confirmado',
  'Vistoria presencial realizada',
  'Relatório fotográfico recebido',
  'Laudo do vistoriador recebido',
  'Conferência de documentos do veículo',
  'Verificação de avarias pré-existentes',
];

export const MOTIVOS_TACOGRAFO_NAO_COLETADO = [
  'Veículo não possui tacógrafo',
  'Tacógrafo danificado no sinistro',
  'Disco não disponível no momento',
  'Recusa do motorista',
  'Veículo já removido do local',
  'Tacógrafo digital sem extração possível',
];

export const FAIXAS_VELOCIDADE = [
  'Até 40 km/h',
  '41 a 60 km/h',
  '61 a 80 km/h',
  '81 a 100 km/h',
  '101 a 120 km/h',
  'Acima de 120 km/h',
  'Não registrada',
];

export const VELOCIDADES_PERMITIDAS = [
  '30 km/h',
  '40 km/h',
  '50 km/h',
  '60 km/h',
  '80 km/h',
  '100 km/h',
  '110 km/h',
  '120 km/h',
  'Não identificada',
];

// Aba 3
export const HISTORICO_STATUS_OPTIONS = ['Completo', 'Incompleto', 'Sem informações'];

export const SALVADOS_OPTIONS = [
  'Venda',
  'Perda total',
  'Solicitação',
  'Comunicação de descarte',
  'N/A',
];

export const CHECKLIST_ESPECIAL_ITEMS = [
  'Máquinas',
  'Equipamentos',
  'Algodão',
  'JSL Vidro',
  'Veículo zero',
  'Veículo refrigerado',
];

export const JUSTIFICATIVAS_PLANILHA = [
  'Sem prejuízo apurado',
  'Documentação insuficiente',
  'Aguardando laudo técnico',
  'Processo de perda total',
  'Roubo/Furto sem recuperação',
];

export const NAO_CONFORMIDADE_DESCRICOES = [
  'Divergência de informações no laudo',
  'Documentação incompleta do vistoriador',
  'Prazo de vistoria excedido',
  'Fotos insuficientes ou inadequadas',
  'Falta de detalhamento técnico',
  'Erro na classificação de danos',
  'Não atendimento ao protocolo padrão',
];

// Aba 4
export const MOTIVOS_PREJUIZO_NAO_APURADO = [
  'Documentação insuficiente',
  'Carga não declarada',
  'Sem nota fiscal',
  'Divergência de informações',
  'Processo de roubo/furto',
  'Aguardando perícia',
];

// Aba 5
export const MODELOS_FINALIZAR_CENTRAL = [
  'Modelo padrão - Colisão',
  'Modelo padrão - Tombamento',
  'Modelo padrão - Roubo/Furto',
  'Modelo padrão - Incêndio',
  'Modelo padrão - Alagamento',
  'Modelo padrão - Avaria de carga',
  'Modelo padrão - Fenômeno natural',
  'Modelo simplificado',
];

export const CAUSAS_EVENTO = [
  'Colisão',
  'Tombamento',
  'Roubo/Furto',
  'Incêndio',
  'Alagamento',
  'Queda de carga',
  'Avaria de carga',
  'Fenômeno natural',
  'Falha mecânica',
  'Outros',
];

export const DECLARACAO_OPTIONS = ['Recebida', 'Não recebida', 'N/A'];
export const BO_OPTIONS = ['Recebido', 'Não recebido', 'N/A'];

export const LOCAIS_EVENTO = [
  'Via pública',
  'Rodovia',
  'Estacionamento',
  'Pátio',
  'Área industrial',
  'Zona rural',
  'Posto de combustível',
  'Terminal de carga',
];

export const DISCO_TACOGRAFO_OPTIONS = ['Analisado', 'Pendente', 'N/A'];

export const PARECERES_VELOCIDADE = [
  'Velocidade compatível com a via',
  'Velocidade acima do permitido',
  'Velocidade não determinante para o evento',
  'Sem dados suficientes para parecer',
  'Tacógrafo não disponível para análise',
  'Velocidade contribuiu para o evento',
];

// Aba 6
export const ACIONAMENTO_OPTIONS = ['Realizado', 'Pendente', 'N/A'];

export const SITUACAO_VEICULO_OPTIONS = [
  'No local do evento',
  'Pátio do Guincho',
  'Pátio da PRF',
  'Sem danos / Liberado Perda Total'
];

export const CONDICOES_MERCADORIA_OPTIONS = [
  'Perda Total',
  'Saque Total',
  'Dispersa no Local',
  'Sem condições de Resgate',
  'Parcialmente Avariada'
];

export const DESTINACAO_MERCADORIA_OPTIONS = [
  'Seguiu Destino',
  'Retornou a Origem',
  'Base da Transportadora',
  'Base do Segurado',
  'Salvados no Local do evento',
  'Salvados Armazenado',
  'Operação de Resgate',
  'Saque Total',
  'Perda Total',
  'Limpeza de Pista'
];

export const DESCRICOES_ATENDIMENTO = [
  'Atendimento padrão no local',
  'Atendimento com remoção do veículo',
  'Atendimento com transbordo de carga',
  'Atendimento com guincho e remoção',
  'Atendimento com perícia no local',
  'Atendimento remoto / sem deslocamento',
];

export const DOCUMENTOS_PENDENTES_ITEMS = [
  'CNH do motorista',
  'CRLV do veículo',
  'Nota fiscal da carga',
  'Boletim de ocorrência',
  'Declaração do motorista',
  'Fotos do sinistro',
  'Laudo do vistoriador',
  'Orçamento de reparo',
  'Disco do tacógrafo',
  'Ata de vistoria',
  'Planilha de prejuízo',
  'Comprovante de entrega',
];

export const VISTORIA_FINAL_OPTIONS = ['Concluída', 'Pendente', 'Agendada'];

// ---- BONIFICAÇÃO ----

export const BONIFICACAO_VALOR = 40; // R$ 40
export const BONIFICACAO_MARCO = 30; // a cada 30 processos

export function calcularBonificacao(processosConcluidos: number): number {
  return Math.floor(processosConcluidos / BONIFICACAO_MARCO) * BONIFICACAO_VALOR;
}

export function progressoProximaBonificacao(processosConcluidos: number): number {
  return processosConcluidos % BONIFICACAO_MARCO;
}

export function calcularFaixa(processosConcluidos: number): 'bronze' | 'prata' | 'ouro' | 'diamante' {
  if (processosConcluidos >= 120) return 'diamante';
  if (processosConcluidos >= 90) return 'ouro';
  if (processosConcluidos >= 60) return 'prata';
  return 'bronze';
}

export const FAIXAS_BONIFICACAO = [
  { faixa: 'Bronze', min: 0, max: 29, processos: '0 - 29', bonus: 'R$ 0', cor: '#CD7F32', icon: '🥉' },
  { faixa: 'Prata', min: 30, max: 59, processos: '30 - 59', bonus: 'R$ 40', cor: '#C0C0C0', icon: '🥈' },
  { faixa: 'Ouro', min: 60, max: 89, processos: '60 - 89', bonus: 'R$ 80', cor: '#FFD700', icon: '🥇' },
  { faixa: 'Diamante', min: 90, max: 999, processos: '90+', bonus: 'R$ 120+', cor: '#B9F2FF', icon: '💎' },
];

// ---- ALERTAS ----

export const ALERTA_DIAS_PARADO = 3; // dias sem movimentação para gerar alerta

export function calcularDiasParado(dataAbertura: string): number {
  const abertura = new Date(dataAbertura);
  const hoje = new Date();
  const diff = Math.floor((hoje.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function isProcessoParado(processo: Processo): boolean {
  if (processo.status === 'Concluído') return false;
  return calcularDiasParado(processo.dataAbertura) >= ALERTA_DIAS_PARADO;
}

// ---- HELPERS DE COR ----

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Em andamento': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'Concluído': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'Pendente': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

export function getFaixaColor(faixa: string): string {
  switch (faixa) {
    case 'bronze': return 'text-amber-700 dark:text-amber-500';
    case 'prata': return 'text-slate-500 dark:text-slate-300';
    case 'ouro': return 'text-yellow-600 dark:text-yellow-400';
    case 'diamante': return 'text-cyan-500 dark:text-cyan-300';
    default: return 'text-gray-500';
  }
}

export function getFaixaBgColor(faixa: string): string {
  switch (faixa) {
    case 'bronze': return 'bg-amber-100 dark:bg-amber-900/20';
    case 'prata': return 'bg-slate-100 dark:bg-slate-800/30';
    case 'ouro': return 'bg-yellow-50 dark:bg-yellow-900/20';
    case 'diamante': return 'bg-cyan-50 dark:bg-cyan-900/20';
    default: return 'bg-gray-100';
  }
}

// ---- DADOS DE DEMONSTRAÇÃO ----

export const operadoresDemo: Operador[] = [
  { id: '1', nome: 'Vinícius', avatar: 'VI', processosRealizados: 98, processosConcluidos: 92, processosEmAndamento: 4, processosPendentes: 2, faixa: 'diamante' },
  { id: '2', nome: 'Amanda', avatar: 'AM', processosRealizados: 75, processosConcluidos: 68, processosEmAndamento: 5, processosPendentes: 2, faixa: 'ouro' },
  { id: '3', nome: 'Natiele', avatar: 'NA', processosRealizados: 63, processosConcluidos: 55, processosEmAndamento: 6, processosPendentes: 2, faixa: 'prata' },
  { id: '4', nome: 'Lisiane', avatar: 'LI', processosRealizados: 51, processosConcluidos: 45, processosEmAndamento: 3, processosPendentes: 3, faixa: 'prata' },
  { id: '5', nome: 'Sabrina', avatar: 'SA', processosRealizados: 34, processosConcluidos: 28, processosEmAndamento: 4, processosPendentes: 2, faixa: 'bronze' },
];

function criarHistoricoDemo(numero: string, operador: string, dataAbertura: string, status: string): HistoricoEntry[] {
  const entries: HistoricoEntry[] = [
    { id: '1', data: dataAbertura, hora: '08:30', operador, acao: 'Processo criado', detalhes: `Processo ${numero} aberto por ${operador}` },
    { id: '2', data: dataAbertura, hora: '09:15', operador, acao: 'Vistoria iniciada', detalhes: 'Dados de vistoria preenchidos' },
  ];
  if (status === 'Em andamento' || status === 'Concluído') {
    entries.push({ id: '3', data: dataAbertura, hora: '10:00', operador, acao: 'Checklist preenchido', detalhes: 'Checklist operacional atualizado' });
  }
  if (status === 'Concluído') {
    entries.push(
      { id: '4', data: dataAbertura, hora: '11:30', operador, acao: 'Prejuízo calculado', detalhes: 'Memória de cálculo finalizada' },
      { id: '5', data: dataAbertura, hora: '14:00', operador, acao: 'Finalização concluída', detalhes: 'Processo finalizado e relatório gerado' },
      { id: '6', data: dataAbertura, hora: '14:30', operador, acao: 'Status alterado', detalhes: 'Status alterado para Concluído' },
    );
  }
  return entries;
}

const SEGURADOS_DEMO = [
  'TORA TRANSPORTES LTDA', 'EXPRESSO ALVORADA LTDA', 'GA4 TRANSPORTES LTDA',
  'RODOVIVA TRANSPORTES LTDA', 'JALE TRANSPORTES LTDA', 'EB TRANSPORTES',
  'RECAUCHUTADORA BARRETOS', 'ALVOAR LACTEOS', 'USIMINAS', 'CARGILL',
  'MARTINI TRANSPORTES', 'MR DA SILVA TRANSPORTES',
];

const SEGURADORAS_DEMO = [
  'SOMPO SEGUROS S.A.', 'CHUBB SEGUROS BRASIL S.A.', 'HDI GLOBAL SEGUROS S.A.',
  'KOVR SEGURADORA S.A.', 'TOKIO MARINE SEGURADORA S/A', 'ALLIANZ SEGUROS S/A',
  'YELUM SEGUROS S.A.', 'FAIRFAX BRASIL SEGUROS', 'AIG SEGUROS BRASIL S/A',
  'AXA SEGUROS S/A', 'M DIAS BRANCO S.A.', 'CARGILL',
];

function criarProcessoDemo(
  id: string, numero: string, operador: string, status: Processo['status'],
  dataAbertura: string, causa: string, local: string
): Processo {
  const concluido = status === 'Concluído';
  const idx = parseInt(id) - 1;
  return {
    id, numero, operador, dataAbertura, status,
    segurado: SEGURADOS_DEMO[idx % SEGURADOS_DEMO.length],
    seguradora: SEGURADORAS_DEMO[idx % SEGURADORAS_DEMO.length],
    historico: criarHistoricoDemo(numero, operador, dataAbertura, status),
    dataEncerramentoVistoriador: concluido ? '2025-05-08' : '',
    dataEncerramentoFinalizarCentral: concluido ? '2025-05-10' : '',
    justificativaAtraso: '',
    atendimentoVistoria: concluido
      ? ['Contato com o segurado realizado', 'Vistoria presencial realizada', 'Relatório fotográfico recebido', 'Laudo do vistoriador recebido']
      : ['Contato com o segurado realizado'],
    tacografoColetado: concluido ? 'sim' : 'nao_necessario',
    motivoTacografoNaoColetado: '',
    velocidadeRegistrada: '61 a 80 km/h',
    velocidadePermitida: '80 km/h',
    discoVencido: false,
    documentosFotosRecebidos: concluido,
    custosAprovados: concluido,
    historicoStatus: concluido ? 'Completo' : 'Incompleto',
    salvadosLancados: concluido ? 'Venda' : 'N/A',
    vistoriadorEncerrado: concluido,
    naoConformidade: false,
    naoConformidadeDescricao: '',
    checklistEspecial: [],
    tratativasEmailEncerradas: concluido,
    inventarioSalvados: concluido,
    planilhaPrejuizoJustificativa: '',
    mercadoriasSemInfo: false,
    limpezaPistaSemTratativas: false,
    periciaSindicante: false,
    alteracaoReserva: false,
    lonaVeiculoInspecionados: false,
    furosNaLona: false,
    todasLonasInspecionadas: false,
    acionamentoSindicancia: false,
    documentosAssinados: concluido,
    documentosAssinadosJustificativa: '',
    mercadoriaNovaOuUsada: '',
    identificacaoAnoModelo: false,
    fotosEtiquetaIdentificacao: false,
    fotosOdometro: false,
    orcamentoReparo: false,
    custosLancados: concluido,
    custosUltrapassaramAutonomia: '',
    seguradoraNotificada: false,
    informacoesComplementaresLancadas: false,
    prejuizoApurado: concluido,
    motivoPrejuizoNaoApurado: '',
    totalEmbarcado: concluido ? [85000, 120000, 45000, 200000, 67000, 150000][parseInt(id) % 6] : 0,
    totalRecebido: concluido ? [78000, 105000, 40000, 180000, 60000, 135000][parseInt(id) % 6] : 0,
    totalRecusado: concluido ? [2000, 5000, 1500, 8000, 3000, 4000][parseInt(id) % 6] : 0,
    salvadosValor: concluido ? [3500, 7000, 2500, 10000, 2800, 8000][parseInt(id) % 6] : 0,
    dispersaoSaque: concluido ? [1500, 3000, 1000, 2000, 1200, 3000][parseInt(id) % 6] : 0,
    modeloFinalizarCentral: causa.includes('Colisão') ? 'Modelo padrão - Colisão' : 'Modelo padrão - Tombamento',
    causaEvento: causa,
    localEvento: local,
    discoTacografo: concluido ? 'Analisado' : 'Pendente',
    parecerVelocidade: concluido ? 'Velocidade compatível com a via' : '',
    acionamentoComunicado: 'Realizado',
    realizadoPor: operador,
    horarioAcionamento: '08:30',
    atendimentoInLoco: true,
    situacaoVeiculo: concluido ? 'Sem danos / Liberado Perda Total' : 'No local do evento',
    condicoesMercadoria: 'Parcialmente Avariada',
    destinacaoMercadoria: concluido ? 'Seguiu Destino' : 'Salvados Armazenado',
    relatoMotorista: concluido ? 'Motorista relatou colisão frontal.' : '',
    resumoAtendimento: concluido ? 'Atendimento no local sem imprevistos.' : '',
    descricaoAtendimento: 'Atendimento padrão no local',
    observacaoAtendimento: '',
    documentosPendentes: concluido ? [] : ['Boletim de ocorrência', 'Disco do tacógrafo'],
    vistoriaFinal: concluido ? 'Concluída' : 'Pendente',
  };
}

export const processosDemo: Processo[] = [
  criarProcessoDemo('1', 'PROC-2025-001', 'Vinícius', 'Concluído', '2025-05-01', 'Colisão', 'Rodovia'),
  criarProcessoDemo('2', 'PROC-2025-002', 'Amanda', 'Em andamento', '2025-05-02', 'Tombamento', 'Rodovia'),
  criarProcessoDemo('3', 'PROC-2025-003', 'Natiele', 'Concluído', '2025-05-03', 'Roubo/Furto', 'Via pública'),
  criarProcessoDemo('4', 'PROC-2025-004', 'Lisiane', 'Pendente', '2025-05-04', 'Incêndio', 'Pátio'),
  criarProcessoDemo('5', 'PROC-2025-005', 'Sabrina', 'Em andamento', '2025-05-05', 'Alagamento', 'Via pública'),
  criarProcessoDemo('6', 'PROC-2025-006', 'Vinícius', 'Concluído', '2025-05-06', 'Avaria de carga', 'Terminal de carga'),
  criarProcessoDemo('7', 'PROC-2025-007', 'Amanda', 'Concluído', '2025-05-07', 'Colisão', 'Rodovia'),
  criarProcessoDemo('8', 'PROC-2025-008', 'Natiele', 'Pendente', '2025-05-08', 'Queda de carga', 'Rodovia'),
  criarProcessoDemo('9', 'PROC-2025-009', 'Lisiane', 'Concluído', '2025-05-09', 'Fenômeno natural', 'Zona rural'),
  criarProcessoDemo('10', 'PROC-2025-010', 'Sabrina', 'Em andamento', '2025-05-10', 'Colisão', 'Via pública'),
  criarProcessoDemo('11', 'PROC-2025-011', 'Vinícius', 'Em andamento', '2025-05-11', 'Tombamento', 'Rodovia'),
  criarProcessoDemo('12', 'PROC-2025-012', 'Amanda', 'Concluído', '2025-05-12', 'Vandalismo', 'Estacionamento'),
];

// Dados para gráficos
export const processosPorMes = [
  { mes: 'Jan', quantidade: 42 },
  { mes: 'Fev', quantidade: 38 },
  { mes: 'Mar', quantidade: 55 },
  { mes: 'Abr', quantidade: 48 },
  { mes: 'Mai', quantidade: 62 },
];

export const processosPorStatus = [
  { status: 'Concluído', quantidade: 42, fill: '#059669' },
  { status: 'Em andamento', quantidade: 22, fill: '#f59e0b' },
  { status: 'Pendente', quantidade: 8, fill: '#dc2626' },
];

export const processosPorCausa = [
  { causa: 'Colisão', quantidade: 28 },
  { causa: 'Tombamento', quantidade: 15 },
  { causa: 'Roubo/Furto', quantidade: 10 },
  { causa: 'Avaria', quantidade: 8 },
  { causa: 'Incêndio', quantidade: 5 },
  { causa: 'Outros', quantidade: 6 },
];
