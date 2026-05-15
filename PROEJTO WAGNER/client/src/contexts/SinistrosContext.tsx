import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type Processo, type HistoricoEntry, processosDemo } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

interface ProcessosContextType {
  processos: Processo[];
  loading: boolean;
  addProcesso: (processo: Omit<Processo, 'id' | 'historico'>) => Promise<Processo>;
  updateStatus: (id: string, status: Processo['status'], operador?: string) => Promise<void>;
  updateProcesso: (id: string, data: Partial<Omit<Processo, 'id' | 'historico'>>) => Promise<void>;
  getProcesso: (id: string) => Processo | undefined;
  duplicarProcesso: (id: string, novoNumero: string) => Promise<Processo | null>;
  addHistoricoEntry: (id: string, entry: Omit<HistoricoEntry, 'id'>) => Promise<void>;
}

const ProcessosContext = createContext<ProcessosContextType | undefined>(undefined);

// Map DB row (snake_case) to Processo (camelCase)
function rowToProcesso(row: Record<string, unknown>, historico: HistoricoEntry[]): Processo {
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
    documentosFotosAnalisados: (row.documentos_fotos_analisados as boolean) || false,
    custosAprovados: (row.custos_aprovados as boolean) || false,
    historicoStatus: (row.historico_status as string) || '',
    salvadosLancados: (row.salvados_lancados as string) || '',
    vistoriadorEncerrado: (row.vistoriador_encerrado as boolean) || false,
    naoConformidade: (row.nao_conformidade as boolean) || false,
    naoConformidadeDescricao: (row.nao_conformidade_descricao as string) || '',
    checklistEspecial: (row.checklist_especial as string[]) || [],
    ataVistoriaConferida: (row.ata_vistoria_conferida as boolean) || false,
    planilhaPrejuizoConferida: (row.planilha_prejuizo_conferida as boolean) || false,
    planilhaPrejuizoJustificativa: (row.planilha_prejuizo_justificativa as string) || '',
    mercadoriasSemInfo: (row.mercadorias_sem_info as boolean) || false,
    limpezaPistaSemTratativas: (row.limpeza_pista_sem_tratativas as boolean) || false,
    periciaSindicante: (row.pericia_sindicante as boolean) || false,
    alteracaoReserva: (row.alteracao_reserva as boolean) || false,
    vistoriaLonaAssoalho: (row.vistoria_lona_assoalho as Processo['vistoriaLonaAssoalho']) || 'na',
    prejuizoApurado: (row.prejuizo_apurado as boolean) || false,
    motivoPrejuizoNaoApurado: (row.motivo_prejuizo_nao_apurado as string) || '',
    totalEmbarcado: Number(row.total_embarcado) || 0,
    totalRecebido: Number(row.total_recebido) || 0,
    totalRecusado: Number(row.total_recusado) || 0,
    salvadosValor: Number(row.salvados_valor) || 0,
    faltaSaque: Number(row.falta_saque) || 0,
    modeloFinalizarCentral: (row.modelo_finalizar_central as string) || '',
    causaEvento: (row.causa_evento as string) || '',
    declaracaoMotorista: (row.declaracao_motorista as string) || '',
    boAcidente: (row.bo_acidente as string) || '',
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
    descricaoAtendimento: (row.descricao_atendimento as string) || '',
    observacaoAtendimento: (row.observacao_atendimento as string) || '',
    documentosPendentes: (row.documentos_pendentes as string[]) || [],
    vistoriaFinal: (row.vistoria_final as string) || '',
  };
}

// Map Processo (camelCase) to DB row (snake_case)
function processoToRow(p: Omit<Processo, 'historico'>) {
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
    documentos_fotos_analisados: p.documentosFotosAnalisados,
    custos_aprovados: p.custosAprovados,
    historico_status: p.historicoStatus,
    salvados_lancados: p.salvadosLancados,
    vistoriador_encerrado: p.vistoriadorEncerrado,
    nao_conformidade: p.naoConformidade,
    nao_conformidade_descricao: p.naoConformidadeDescricao,
    checklist_especial: p.checklistEspecial,
    ata_vistoria_conferida: p.ataVistoriaConferida,
    planilha_prejuizo_conferida: p.planilhaPrejuizoConferida,
    planilha_prejuizo_justificativa: p.planilhaPrejuizoJustificativa,
    mercadorias_sem_info: p.mercadoriasSemInfo,
    limpeza_pista_sem_tratativas: p.limpezaPistaSemTratativas,
    pericia_sindicante: p.periciaSindicante,
    alteracao_reserva: p.alteracaoReserva,
    vistoria_lona_assoalho: p.vistoriaLonaAssoalho,
    prejuizo_apurado: p.prejuizoApurado,
    motivo_prejuizo_nao_apurado: p.motivoPrejuizoNaoApurado,
    total_embarcado: p.totalEmbarcado,
    total_recebido: p.totalRecebido,
    total_recusado: p.totalRecusado,
    salvados_valor: p.salvadosValor,
    falta_saque: p.faltaSaque,
    modelo_finalizar_central: p.modeloFinalizarCentral,
    causa_evento: p.causaEvento,
    declaracao_motorista: p.declaracaoMotorista,
    bo_acidente: p.boAcidente,
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

async function seedDemoData() {
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

export function ProcessosProvider({ children }: { children: ReactNode }) {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      await seedDemoData();

      const { data: rows, error } = await supabase
        .from('processos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !rows || !mounted) {
        setLoading(false);
        return;
      }

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

      const parsed = rows.map(r => rowToProcesso(r as Record<string, unknown>, histMap[r.id as string] || []));
      setProcessos(parsed);
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, []);

  const addProcesso = useCallback(async (data: Omit<Processo, 'id' | 'historico'>) => {
    const now = new Date();
    const id = nanoid();
    const histId = nanoid();
    const histEntry: HistoricoEntry = {
      id: histId,
      data: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      operador: data.operador,
      acao: 'Processo criado',
      detalhes: `Processo ${data.numero} criado por ${data.operador}`,
    };
    const newProcesso: Processo = { ...data, id, historico: [histEntry] };

    await supabase.from('processos').insert(processoToRow(newProcesso));
    await supabase.from('historico_processo').insert({
      id: histId,
      processo_id: id,
      data: histEntry.data,
      hora: histEntry.hora,
      operador: histEntry.operador,
      acao: histEntry.acao,
      detalhes: histEntry.detalhes,
    });

    setProcessos(prev => [newProcesso, ...prev]);
    return newProcesso;
  }, []);

  const updateStatus = useCallback(async (id: string, status: Processo['status'], operador?: string) => {
    const now = new Date();
    const processo = processos.find(p => p.id === id);
    if (!processo) return;

    const entry: HistoricoEntry = {
      id: nanoid(),
      data: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      operador: operador || processo.operador,
      acao: 'Status alterado',
      detalhes: `Status alterado de "${processo.status}" para "${status}"`,
    };

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

    setProcessos(prev => prev.map(p => p.id === id ? { ...p, status, historico: [...p.historico, entry] } : p));
  }, [processos]);

  const updateProcesso = useCallback(async (id: string, data: Partial<Omit<Processo, 'id' | 'historico'>>) => {
    const processo = processos.find(p => p.id === id);
    if (!processo) return;

    const merged = { ...processo, ...data };
    const { historico: _, ...rest } = merged;
    const row = processoToRow(rest);
    await supabase.from('processos').update(row).eq('id', id);

    setProcessos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, [processos]);

  const getProcesso = useCallback((id: string) => {
    return processos.find(p => p.id === id);
  }, [processos]);

  const duplicarProcesso = useCallback(async (id: string, novoNumero: string) => {
    const original = processos.find(p => p.id === id);
    if (!original) return null;

    const now = new Date();
    const newId = nanoid();
    const histId = nanoid();
    const histEntry: HistoricoEntry = {
      id: histId,
      data: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      operador: original.operador,
      acao: 'Processo duplicado',
      detalhes: `Duplicado a partir do processo ${original.numero}`,
    };

    const duplicado: Processo = {
      ...original,
      id: newId,
      numero: novoNumero,
      status: 'Em andamento',
      dataAbertura: now.toISOString().split('T')[0],
      historico: [histEntry],
    };

    const { historico: _, ...rest } = duplicado;
    await supabase.from('processos').insert(processoToRow(rest));
    await supabase.from('historico_processo').insert({
      id: histId,
      processo_id: newId,
      data: histEntry.data,
      hora: histEntry.hora,
      operador: histEntry.operador,
      acao: histEntry.acao,
      detalhes: histEntry.detalhes,
    });

    setProcessos(prev => [duplicado, ...prev]);
    return duplicado;
  }, [processos]);

  const addHistoricoEntry = useCallback(async (id: string, entry: Omit<HistoricoEntry, 'id'>) => {
    const entryId = nanoid();
    await supabase.from('historico_processo').insert({
      id: entryId,
      processo_id: id,
      data: entry.data,
      hora: entry.hora,
      operador: entry.operador,
      acao: entry.acao,
      detalhes: entry.detalhes,
    });

    setProcessos(prev => prev.map(p =>
      p.id === id ? { ...p, historico: [...p.historico, { ...entry, id: entryId }] } : p
    ));
  }, []);

  return (
    <ProcessosContext.Provider value={{ processos, loading, addProcesso, updateStatus, updateProcesso, getProcesso, duplicarProcesso, addHistoricoEntry }}>
      {children}
    </ProcessosContext.Provider>
  );
}

export function useProcessos() {
  const context = useContext(ProcessosContext);
  if (!context) throw new Error('useProcessos must be used within ProcessosProvider');
  return context;
}
