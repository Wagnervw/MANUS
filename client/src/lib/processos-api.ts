import { type Processo, type HistoricoEntry, processosDemo } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export function rowToProcesso(row: Record<string, unknown>, historico: HistoricoEntry[]): Processo {
  return {
    id: row.id as string,
    numero: row.numero as string,
    operador: row.operador as string,
    segurado: row.segurado as string,
    seguradora: row.seguradora as string,
    dataAbertura: row.data_abertura as string,
    status: row.status as Processo['status'],
    historico,
    dataEncerramentoVistoriador: (row.data_encerramento_vistoriador as string) || '',
    dataEncerramentoFinalizarCentral: (row.data_encerramento_finalizar_central as string) || '',
    justificativaAtraso: (row.justificativa_atraso as string) || '',
    atendimentoVistoria: (row.atendimento_vistoria as string[]) || [],
    tacografoColetado: (row.tacografo_coletado as Processo['tacografoColetado']) || 'nao_necessario',
    motivoTacografoNaoColetado: (row.motivo_tacografo_nao_coletado as string) || '',
    velocidadeRegistrada: (row.velocidade_registrada as string) || '',
    velocidadePermitida: (row.velocidade_permitida as string) || '',
    discoVencido: (row.disco_vencido as boolean) || false,
    documentosFotosRecebidos: (row.documentos_fotos_recebidos as boolean) || false,
    custosAprovados: (row.custos_aprovados as boolean) || false,
    historicoStatus: (row.historico_status as string) || '',
    salvadosLancados: (row.salvados_lancados as string) || '',
    vistoriadorEncerrado: (row.vistoriador_encerrado as boolean) || false,
    naoConformidade: (row.nao_conformidade as boolean) || false,
    naoConformidadeDescricao: (row.nao_conformidade_descricao as string) || '',
    checklistEspecial: (row.checklist_especial as string[]) || [],
    tratativasEmailEncerradas: (row.tratativas_email_encerradas as boolean) || false,
    inventarioSalvados: (row.inventario_salvados as boolean) || false,
    planilhaPrejuizoJustificativa: (row.planilha_prejuizo_justificativa as string) || '',
    mercadoriasSemInfo: (row.mercadorias_sem_info as boolean) || false,
    limpezaPistaSemTratativas: (row.limpeza_pista_sem_tratativas as boolean) || false,
    periciaSindicante: (row.pericia_sindicante as boolean) || false,
    alteracaoReserva: (row.alteracao_reserva as boolean) || false,
    lonaVeiculoInspecionados: (row.lona_veiculo_inspecionados as boolean) || false,
    furosNaLona: (row.furos_na_lona as boolean) || false,
    todasLonasInspecionadas: (row.todas_lonas_inspecionadas as boolean) || false,
    acionamentoSindicancia: (row.acionamento_sindicancia as boolean) || false,
    documentosAssinados: (row.documentos_assinados as boolean) || false,
    documentosAssinadosJustificativa: (row.documentos_assinados_justificativa as string) || '',
    mercadoriaNovaOuUsada: (row.mercadoria_nova_ou_usada as string) || '',
    identificacaoAnoModelo: (row.identificacao_ano_modelo as boolean) || false,
    fotosEtiquetaIdentificacao: (row.fotos_etiqueta_identificacao as boolean) || false,
    fotosOdometro: (row.fotos_odometro as boolean) || false,
    orcamentoReparo: (row.orcamento_reparo as boolean) || false,
    custosLancados: (row.custos_lancados as boolean) || false,
    custosUltrapassaramAutonomia: (row.custos_ultrapassaram_autonomia as string) || '',
    seguradoraNotificada: (row.seguradora_notificada as boolean) || false,
    informacoesComplementaresLancadas: (row.informacoes_complementares_lancadas as boolean) || false,
    prejuizoApurado: (row.prejuizo_apurado as boolean) || false,
    motivoPrejuizoNaoApurado: (row.motivo_prejuizo_nao_apurado as string) || '',
    totalEmbarcado: Number(row.total_embarcado) || 0,
    totalRecebido: Number(row.total_recebido) || 0,
    totalRecusado: Number(row.total_recusado) || 0,
    salvadosValor: Number(row.salvados_valor) || 0,
    dispersaoSaque: Number(row.dispersao_saque) || 0,
    modeloFinalizarCentral: (row.modelo_finalizar_central as string) || '',
    causaEvento: (row.causa_evento as string) || '',
    localEvento: (row.local_evento as string) || '',
    discoTacografo: (row.disco_tacografo as string) || '',
    parecerVelocidade: (row.parecer_velocidade as string) || '',
    acionamentoComunicado: (row.acionamento_comunicado as string) || '',
    realizadoPor: (row.realizado_por as string) || '',
    horarioAcionamento: (row.horario_acionamento as string) || '',
    atendimentoInLoco: (row.atendimento_in_loco as boolean) || false,
    situacaoVeiculo: (row.situacao_veiculo as string) || '',
    condicoesMercadoria: (row.condicoes_mercadoria as string) || '',
    destinacaoMercadoria: (row.destinacao_mercadoria as string) || '',
    relatoMotorista: (row.relato_motorista as string) || '',
    resumoAtendimento: (row.resumo_atendimento as string) || '',
    descricaoAtendimento: (row.descricao_atendimento as string) || '',
    observacaoAtendimento: (row.observacao_atendimento as string) || '',
    documentosPendentes: (row.documentos_pendentes as string[]) || [],
    vistoriaFinal: (row.vistoria_final as string) || '',
  };
}

export function processoToRow(p: Omit<Processo, 'historico'>) {
  return {
    id: p.id,
    numero: p.numero,
    operador: p.operador,
    segurado: p.segurado,
    seguradora: p.seguradora,
    data_abertura: p.dataAbertura,
    status: p.status,
    data_encerramento_vistoriador: p.dataEncerramentoVistoriador,
    data_encerramento_finalizar_central: p.dataEncerramentoFinalizarCentral,
    justificativa_atraso: p.justificativaAtraso,
    atendimento_vistoria: p.atendimentoVistoria,
    tacografo_coletado: p.tacografoColetado,
    motivo_tacografo_nao_coletado: p.motivoTacografoNaoColetado,
    velocidade_registrada: p.velocidadeRegistrada,
    velocidade_permitida: p.velocidadePermitida,
    disco_vencido: p.discoVencido,
    documentos_fotos_recebidos: p.documentosFotosRecebidos,
    custos_aprovados: p.custosAprovados,
    historico_status: p.historicoStatus,
    salvados_lancados: p.salvadosLancados,
    vistoriador_encerrado: p.vistoriadorEncerrado,
    nao_conformidade: p.naoConformidade,
    nao_conformidade_descricao: p.naoConformidadeDescricao,
    checklist_especial: p.checklistEspecial,
    tratativas_email_encerradas: p.tratativasEmailEncerradas,
    inventario_salvados: p.inventarioSalvados,
    planilha_prejuizo_justificativa: p.planilhaPrejuizoJustificativa,
    mercadorias_sem_info: p.mercadoriasSemInfo,
    limpeza_pista_sem_tratativas: p.limpezaPistaSemTratativas,
    pericia_sindicante: p.periciaSindicante,
    alteracao_reserva: p.alteracaoReserva,
    lona_veiculo_inspecionados: p.lonaVeiculoInspecionados,
    furos_na_lona: p.furosNaLona,
    todas_lonas_inspecionadas: p.todasLonasInspecionadas,
    acionamento_sindicancia: p.acionamentoSindicancia,
    documentos_assinados: p.documentosAssinados,
    documentos_assinados_justificativa: p.documentosAssinadosJustificativa,
    mercadoria_nova_ou_usada: p.mercadoriaNovaOuUsada,
    identificacao_ano_modelo: p.identificacaoAnoModelo,
    fotos_etiqueta_identificacao: p.fotosEtiquetaIdentificacao,
    fotos_odometro: p.fotosOdometro,
    orcamento_reparo: p.orcamentoReparo,
    custos_lancados: p.custosLancados,
    custos_ultrapassaram_autonomia: p.custosUltrapassaramAutonomia,
    seguradora_notificada: p.seguradoraNotificada,
    informacoes_complementares_lancadas: p.informacoesComplementaresLancadas,
    prejuizo_apurado: p.prejuizoApurado,
    motivo_prejuizo_nao_apurado: p.motivoPrejuizoNaoApurado,
    total_embarcado: p.totalEmbarcado,
    total_recebido: p.totalRecebido,
    total_recusado: p.totalRecusado,
    salvados_valor: p.salvadosValor,
    dispersao_saque: p.dispersaoSaque,
    modelo_finalizar_central: p.modeloFinalizarCentral,
    causa_evento: p.causaEvento,
    local_evento: p.localEvento,
    disco_tacografo: p.discoTacografo,
    parecer_velocidade: p.parecerVelocidade,
    acionamento_comunicado: p.acionamentoComunicado,
    realizado_por: p.realizadoPor,
    horario_acionamento: p.horarioAcionamento,
    atendimento_in_loco: p.atendimentoInLoco,
    situacao_veiculo: p.situacaoVeiculo,
    condicoes_mercadoria: p.condicoesMercadoria,
    destinacao_mercadoria: p.destinacaoMercadoria,
    relato_motorista: p.relatoMotorista,
    resumo_atendimento: p.resumoAtendimento,
    descricao_atendimento: p.descricaoAtendimento,
    observacao_atendimento: p.observacaoAtendimento,
    documentos_pendentes: p.documentosPendentes,
    vistoria_final: p.vistoriaFinal,
    updated_at: new Date().toISOString(),
  };
}

function historicoRowToEntry(row: Record<string, unknown>): HistoricoEntry {
  return {
    id: row.id as string,
    data: row.data as string,
    hora: row.hora as string,
    operador: row.operador as string,
    acao: row.acao as string,
    detalhes: row.detalhes as string,
  };
}

let seeded = false;
async function seedDemoData() {
  if (seeded) return;
  seeded = true;
  const { count } = await supabase.from('processos').select('*', { count: 'exact', head: true });
  if (count && count > 0) return;

  for (const p of processosDemo) {
    const { historico, ...rest } = p;
    await supabase.from('processos').insert(processoToRow({ ...rest, id: p.id }));
    const histRows = historico.map(h => ({
      id: h.id,
      processo_id: p.id,
      data: h.data,
      hora: h.hora,
      operador: h.operador,
      acao: h.acao,
      detalhes: h.detalhes,
    }));
    if (histRows.length > 0) {
      await supabase.from('historico_processo').insert(histRows);
    }
  }
}

export async function fetchProcessos(): Promise<Processo[]> {
  await seedDemoData();

  const { data: rows, error } = await supabase
    .from('processos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !rows) return [];

  const { data: histRows } = await supabase
    .from('historico_processo')
    .select('*')
    .order('created_at', { ascending: true });

  const histMap: Record<string, HistoricoEntry[]> = {};
  for (const h of (histRows || [])) {
    const pid = h.processo_id as string;
    if (!histMap[pid]) histMap[pid] = [];
    histMap[pid].push(historicoRowToEntry(h as Record<string, unknown>));
  }

  return rows.map(r => rowToProcesso(r as Record<string, unknown>, histMap[r.id as string] || []));
}

export async function insertProcesso(data: Omit<Processo, 'id' | 'historico'>, id: string, histEntry: HistoricoEntry): Promise<Processo> {
  const newProcesso: Processo = { ...data, id, historico: [histEntry] };

  await supabase.from('processos').insert(processoToRow(newProcesso));
  await supabase.from('historico_processo').insert({
    id: histEntry.id,
    processo_id: id,
    data: histEntry.data,
    hora: histEntry.hora,
    operador: histEntry.operador,
    acao: histEntry.acao,
    detalhes: histEntry.detalhes,
  });

  return newProcesso;
}

export async function updateProcessoStatus(id: string, status: Processo['status'], entry: HistoricoEntry) {
  await supabase.from('processos').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  await supabase.from('historico_processo').insert({
    id: entry.id,
    processo_id: id,
    data: entry.data,
    hora: entry.hora,
    operador: entry.operador,
    acao: entry.acao,
    detalhes: entry.detalhes,
  });
}

export async function updateProcessoData(id: string, data: Partial<Omit<Processo, 'id' | 'historico'>>, original: Processo) {
  const merged = { ...original, ...data };
  const { historico: _, ...rest } = merged;
  const row = processoToRow(rest);
  await supabase.from('processos').update(row).eq('id', id);
}

export async function duplicateProcesso(original: Processo, newId: string, novoNumero: string, histEntry: HistoricoEntry): Promise<Processo> {
  const duplicado: Processo = {
    ...original,
    id: newId,
    numero: novoNumero,
    status: 'Em andamento',
    dataAbertura: new Date().toISOString().split('T')[0],
    historico: [histEntry],
  };

  const { historico: _, ...rest } = duplicado;
  await supabase.from('processos').insert(processoToRow(rest));
  await supabase.from('historico_processo').insert({
    id: histEntry.id,
    processo_id: newId,
    data: histEntry.data,
    hora: histEntry.hora,
    operador: histEntry.operador,
    acao: histEntry.acao,
    detalhes: histEntry.detalhes,
  });

  return duplicado;
}

export async function insertHistoricoEntry(processoId: string, entry: HistoricoEntry) {
  await supabase.from('historico_processo').insert({
    id: entry.id,
    processo_id: processoId,
    data: entry.data,
    hora: entry.hora,
    operador: entry.operador,
    acao: entry.acao,
    detalhes: entry.detalhes,
  });
}
