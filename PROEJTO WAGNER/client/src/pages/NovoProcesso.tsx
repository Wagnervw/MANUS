import { useState, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useProcessos } from '@/contexts/SinistrosContext';
import { generateProcessoReport } from '@/lib/generateReport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  MEMBROS_CELULA,
  ATENDIMENTO_VISTORIA_ITEMS,
  MOTIVOS_TACOGRAFO_NAO_COLETADO,
  FAIXAS_VELOCIDADE,
  VELOCIDADES_PERMITIDAS,
  HISTORICO_STATUS_OPTIONS,
  SALVADOS_OPTIONS,
  CHECKLIST_ESPECIAL_ITEMS,
  JUSTIFICATIVAS_PLANILHA,
  MOTIVOS_PREJUIZO_NAO_APURADO,
  MODELOS_FINALIZAR_CENTRAL,
  CAUSAS_EVENTO,
  DECLARACAO_OPTIONS,
  BO_OPTIONS,
  LOCAIS_EVENTO,
  DISCO_TACOGRAFO_OPTIONS,
  PARECERES_VELOCIDADE,
  ACIONAMENTO_OPTIONS,
  SITUACAO_VEICULO_OPTIONS,
  CONDICOES_MERCADORIA_OPTIONS,
  DESTINACAO_MERCADORIA_OPTIONS,
  DESCRICOES_ATENDIMENTO,
  DOCUMENTOS_PENDENTES_ITEMS,
  VISTORIA_FINAL_OPTIONS,
  NAO_CONFORMIDADE_DESCRICOES,
  SEGURADORAS,
  type Processo,
} from '@/lib/data';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  ClipboardCheck,
  Calculator,
  Flag,
  Phone,
  FileDown,
  PenLine,
  Plus,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Abertura', icon: FileText },
  { id: 2, title: 'Vistoria', icon: Search },
  { id: 3, title: 'Checklist', icon: ClipboardCheck },
  { id: 4, title: 'Prejuizo', icon: Calculator },
  { id: 5, title: 'Finalizar', icon: Flag },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">{children}</h3>;
}

function ToggleRow({ label, checked, onChange, id }: { label: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
      <Label htmlFor={id} className="text-sm font-medium cursor-pointer flex-1">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={cn(
      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-all duration-150',
      checked ? 'bg-primary/10 border-primary/40 text-foreground' : 'bg-card border-border text-foreground hover:border-primary/30'
    )}>
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="font-medium">{label}</span>
    </label>
  );
}

export default function NovoProcesso() {
  const [, navigate] = useLocation();
  const { addProcesso } = useProcessos();
  const [step, setStep] = useState(1);
  const [showAssinaturaDialog, setShowAssinaturaDialog] = useState(false);
  const [assinatura, setAssinatura] = useState('');
  const pendingProcesso = useRef<Omit<import('@/lib/data').Processo, 'id' | 'historico'> | null>(null);

  // ---- Aba 1: Abertura ----
  const [numero, setNumero] = useState('');
  const [operador, setOperador] = useState('');
  const [segurado, setSegurado] = useState('');
  const [seguradora, setSeguradora] = useState('');
  const [causa, setCausa] = useState('');
  const [dataEncVistoria, setDataEncVistoria] = useState('');
  const [dataEncFinalizar, setDataEncFinalizar] = useState('');
  const dataAbertura = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customOperadores, setCustomOperadores] = useState<string[]>([]);
  const [customCausas, setCustomCausas] = useState<string[]>([]);
  const [customSeguradoras, setCustomSeguradoras] = useState<string[]>([]);
  const [showAddOperador, setShowAddOperador] = useState(false);
  const [showAddCausa, setShowAddCausa] = useState(false);
  const [showAddSeguradora, setShowAddSeguradora] = useState(false);
  const [novoOperador, setNovoOperador] = useState('');
  const [novaCausa, setNovaCausa] = useState('');
  const [novaSeguradora, setNovaSeguradora] = useState('');
  const allOperadores = [...MEMBROS_CELULA, ...customOperadores];
  const allCausas = [...CAUSAS_EVENTO, ...customCausas];
  const allSeguradoras = [...SEGURADORAS, ...customSeguradoras];

  // ---- Aba 2: Vistoria / Atendimento ----
  // Atendimento fields
  const [resumoAcionamento, setResumoAcionamento] = useState('');
  const [situacaoVeiculoAba2, setSituacaoVeiculoAba2] = useState('');
  const [condicoesMercadoriaAba2, setCondicoesMercadoriaAba2] = useState('');
  const [providenciasTomadas, setProvidenciasTomadas] = useState('');
  const [destinacaoMercadoriaAba2, setDestinacaoMercadoriaAba2] = useState('');
  const [descricaoAtendimentoAba2, setDescricaoAtendimentoAba2] = useState('');
  const [limpezaPistaAba2, setLimpezaPistaAba2] = useState(false);
  const [declaracaoMotoristaAba2, setDeclaracaoMotoristaAba2] = useState('');
  const [boAcidenteAba2, setBoAcidenteAba2] = useState('');
  const [localEventoAba2, setLocalEventoAba2] = useState('');
  
  // Vistoria fields
  const [checklistMaquinasAba2, setChecklistMaquinasAba2] = useState<string[]>([]);
  const [ataVistoriaAba2, setAtaVistoriaAba2] = useState(false);
  const [planilhaPrejuizoAba2, setPlanilhaPrejuizoAba2] = useState(false);
  const [identificacaoAnoModelo, setIdentificacaoAnoModelo] = useState('');
  const [vistoriaLonaAba2, setVistoriaLonaAba2] = useState<'sim' | 'nao' | 'na'>('na');
  const [ressalvaRecusa, setRessalvaRecusa] = useState('');
  const [acionamentoPericia, setAcionamentoPericia] = useState(false);
  
  // Tacógrafo (mantém na parte inferior)
  const [justificativaAtraso, setJustificativaAtraso] = useState('');
  const [atendimentoVistoria, setAtendimentoVistoria] = useState<string[]>([]);
  const [tacografo, setTacografo] = useState<'sim' | 'nao' | 'nao_necessario'>('nao_necessario');
  const [motivoTacografo, setMotivoTacografo] = useState('');
  const [velRegistrada, setVelRegistrada] = useState('');
  const [velPermitida, setVelPermitida] = useState('');
  const [discoVencido, setDiscoVencido] = useState(false);

  // ---- Aba 3: Checklist Operacional ----
  const [docsFotos, setDocsFotos] = useState(false);
  const [custosAprovados, setCustosAprovados] = useState(false);
  const [historicoStatus, setHistoricoStatus] = useState('');
  const [salvadosLancados, setSalvadosLancados] = useState('');
  const [vistoriadorEncerrado, setVistoriadorEncerrado] = useState(false);
  const [naoConformidade, setNaoConformidade] = useState(false);
  const [naoConformidadeDesc, setNaoConformidadeDesc] = useState('');
  const [checklistEspecial, setChecklistEspecial] = useState<string[]>([]);
  const [ataConferida, setAtaConferida] = useState(false);
  const [planilhaConferida, setPlanilhaConferida] = useState(false);
  const [planilhaJustificativa, setPlanilhaJustificativa] = useState('');
  const [mercadoriasSemInfo, setMercadoriasSemInfo] = useState(false);
  const [limpezaPista, setLimpezaPista] = useState(false);
  const [pericia, setPericia] = useState(false);
  const [alteracaoReserva, setAlteracaoReserva] = useState(false);
  const [vistoriaLona, setVistoriaLona] = useState<'sim' | 'nao' | 'na'>('na');

  // ---- Aba 4: Prejuízo ----
  const [prejuizoApurado, setPrejuizoApurado] = useState(true);
  const [motivoPrejuizo, setMotivoPrejuizo] = useState('');
  const [totalEmbarcado, setTotalEmbarcado] = useState(0);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalRecusado, setTotalRecusado] = useState(0);
  const [salvadosValor, setSalvadosValor] = useState(0);
  const [faltaSaque, setFaltaSaque] = useState(0);

  // ---- Aba 5: Finalizar Central ----
  const [modelo, setModelo] = useState('');
  const [bo, setBo] = useState('');
  const [discoTacografo, setDiscoTacografo] = useState('');
  const [parecer, setParecer] = useState('');

  // ---- Aba 6: Acionamento ----
  const [acionamento, setAcionamento] = useState('');
  const [realizadoPor, setRealizadoPor] = useState('');
  const [horario, setHorario] = useState('');
  const [atendimentoInLoco, setAtendimentoInLoco] = useState(false);
  const [situacaoVeiculo, setSituacaoVeiculo] = useState('');
  const [condicoesMerc, setCondicoesMerc] = useState('');
  const [destinacaoMerc, setDestinacaoMerc] = useState('');
  const [descricaoAtend, setDescricaoAtend] = useState('');
  const [obsAtend, setObsAtend] = useState('');
  const [docsPendentes, setDocsPendentes] = useState<string[]>([]);
  const [vistoriaFinal, setVistoriaFinal] = useState('');

  const toggleList = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const memoriaCalculo = useMemo(() => {
    return totalEmbarcado - totalRecebido - totalRecusado - salvadosValor + faltaSaque;
  }, [totalEmbarcado, totalRecebido, totalRecusado, salvadosValor, faltaSaque]);

  const temAtraso = useMemo(() => {
    if (!dataEncVistoria || !dataEncFinalizar) return false;
    return new Date(dataEncFinalizar) > new Date(dataEncVistoria);
  }, [dataEncVistoria, dataEncFinalizar]);

  const handleSubmit = () => {
    if (!numero || !operador) {
      toast.error('Preencha o número do processo e selecione o operador');
      return;
    }
    const processo: Omit<Processo, 'id' | 'historico'> = {
      numero, operador, segurado, seguradora, dataAbertura, status: 'Em andamento',
      dataEncerramentoVistoriador: dataEncVistoria,
      dataEncerramentoFinalizarCentral: dataEncFinalizar,
      justificativaAtraso: temAtraso ? justificativaAtraso : '',
      atendimentoVistoria,
      tacografoColetado: tacografo,
      motivoTacografoNaoColetado: tacografo === 'nao' ? motivoTacografo : '',
      velocidadeRegistrada: velRegistrada,
      velocidadePermitida: velPermitida,
      discoVencido,
      documentosFotosAnalisados: docsFotos,
      custosAprovados,
      historicoStatus,
      salvadosLancados,
      vistoriadorEncerrado,
      naoConformidade,
      naoConformidadeDescricao: naoConformidade ? naoConformidadeDesc : '',
      checklistEspecial,
      ataVistoriaConferida: ataConferida,
      planilhaPrejuizoConferida: planilhaConferida,
      planilhaPrejuizoJustificativa: !planilhaConferida ? planilhaJustificativa : '',
      mercadoriasSemInfo,
      limpezaPistaSemTratativas: limpezaPista,
      periciaSindicante: pericia,
      alteracaoReserva,
      vistoriaLonaAssoalho: vistoriaLona,
      prejuizoApurado,
      motivoPrejuizoNaoApurado: !prejuizoApurado ? motivoPrejuizo : '',
      totalEmbarcado, totalRecebido, totalRecusado, salvadosValor, faltaSaque,
      modeloFinalizarCentral: modelo,
      causaEvento: causa,
      declaracaoMotorista: declaracaoMotoristaAba2,
      boAcidente: bo,
      localEvento: localEventoAba2,
      discoTacografo,
      parecerVelocidade: parecer,
      acionamentoComunicado: acionamento,
      realizadoPor,
      horarioAcionamento: horario,
      atendimentoInLoco,
      situacaoVeiculo,
      condicoesMercadoria: condicoesMerc,
      destinacaoMercadoria: destinacaoMerc,
      descricaoAtendimento: descricaoAtend,
      observacaoAtendimento: obsAtend,
      documentosPendentes: docsPendentes,
      vistoriaFinal,
    };
    
    pendingProcesso.current = processo;
    setShowAssinaturaDialog(true);
  };

  const handleAssinatura = async () => {
    if (!assinatura.trim()) {
      toast.error('Digite sua assinatura digital');
      return;
    }
    if (!pendingProcesso.current) return;

    const novoProcesso = await addProcesso(pendingProcesso.current);

    // Gerar PDF com assinatura
    generateProcessoReport(novoProcesso, assinatura);

    toast.success('Processo criado e relatório gerado com sucesso!');
    setShowAssinaturaDialog(false);
    navigate('/processos');
  };

  const canAdvance = () => {
    if (step === 1) return !!numero && !!operador;
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Novo Processo</h1>
        <p className="text-sm text-muted-foreground mt-1">Preencha as informações em etapas — selecione as opções, sem necessidade de digitar</p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, transitionTimingFunction: 'var(--ease-out-expo)' }}
          />
          {STEPS.map((s) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="relative flex flex-col items-center z-10">
                <button
                  onClick={() => setStep(s.id)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 cursor-pointer hover:scale-110',
                    done ? 'bg-primary text-primary-foreground' : current ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {done ? <Check className="w-5 h-5" /> : s.id}
                </button>
                <span className="text-xs mt-2 font-medium text-center w-16">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Etapa {step} de {STEPS.length}: {STEPS[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ============ ABA 1: ABERTURA ============ */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Número do Processo *</Label>
                <Input
                  placeholder="Ex: PROC-2025-001"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Operador *</Label>
                <div className="flex gap-2">
                  <Select value={operador} onValueChange={setOperador}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione o operador" /></SelectTrigger>
                    <SelectContent>{allOperadores.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowAddOperador(true)} title="Adicionar operador">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Segurado</Label>
                <Input
                  placeholder="Nome do segurado (empresa/pessoa)"
                  value={segurado}
                  onChange={e => setSegurado(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Seguradora</Label>
                <div className="flex gap-2">
                  <Select value={seguradora} onValueChange={setSeguradora}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione a seguradora" /></SelectTrigger>
                    <SelectContent>{allSeguradoras.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowAddSeguradora(true)} title="Adicionar seguradora">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Abertura</Label>
                <Input type="text" value={dataAbertura} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Causa do Evento *</Label>
                <div className="flex gap-2">
                  <Select value={causa} onValueChange={setCausa}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione a causa" /></SelectTrigger>
                    <SelectContent>{allCausas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowAddCausa(true)} title="Adicionar causa">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <SectionTitle>Prazos</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Encerramento Vistoria</Label>
                  <Input type="date" value={dataEncVistoria} onChange={e => setDataEncVistoria(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Encerramento Finalizar Central</Label>
                  <Input type="date" value={dataEncFinalizar} onChange={e => setDataEncFinalizar(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Prazo: 5 dias após encerramento da vistoria</p>
                </div>
              </div>
            </>
          )}

          {/* ============ ABA 2: VISTORIA ============ */}
          {step === 2 && (
            <>

              <SectionTitle>Atendimento e Vistoria</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Painel Atendimento */}
                <div className="border border-border rounded-lg">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="atendimento">
                      <AccordionTrigger className="px-4">📋 Atendimento</AccordionTrigger>
                      <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Resumo do Acionamento</Label>
                          <Textarea placeholder="Descreva o resumo..." value={resumoAcionamento} onChange={e => setResumoAcionamento(e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>Situação do Veículo</Label>
                          <Select value={situacaoVeiculoAba2} onValueChange={setSituacaoVeiculoAba2}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{SITUACAO_VEICULO_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Condições da Mercadoria</Label>
                          <Select value={condicoesMercadoriaAba2} onValueChange={setCondicoesMercadoriaAba2}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{CONDICOES_MERCADORIA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Providências Tomadas</Label>
                          <Textarea placeholder="Descreva as providências..." value={providenciasTomadas} onChange={e => setProvidenciasTomadas(e.target.value)} rows={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>Destinação da Mercadoria</Label>
                          <Select value={destinacaoMercadoriaAba2} onValueChange={setDestinacaoMercadoriaAba2}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{DESTINACAO_MERCADORIA_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>

                        <ToggleRow label="Limpeza de Pista" checked={limpezaPistaAba2} onChange={setLimpezaPistaAba2} id="limpeza-pista-aba2" />
                        <div className="space-y-2">
                          <Label>Declaração do Motorista</Label>
                          <Select value={declaracaoMotoristaAba2} onValueChange={setDeclaracaoMotoristaAba2}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{DECLARACAO_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Boletim de Ocorrência do Acidente</Label>
                          <Select value={boAcidenteAba2} onValueChange={setBoAcidenteAba2}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{BO_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Local do Evento</Label>
                          <Select value={localEventoAba2} onValueChange={setLocalEventoAba2}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{LOCAIS_EVENTO.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                {/* Painel Vistoria */}
                <div className="border border-border rounded-lg">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="vistoria">
                      <AccordionTrigger className="px-4">🔍 Vistoria</AccordionTrigger>
                      <AccordionContent className="px-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Checklist de Máquinas/Equipamentos</Label>
                          <div className="space-y-2 mt-2">
                            {CHECKLIST_ESPECIAL_ITEMS.map(item => (
                              <CheckItem key={item} label={item} checked={checklistMaquinasAba2.includes(item)} onChange={() => toggleList(checklistMaquinasAba2, setChecklistMaquinasAba2, item)} />
                            ))}
                          </div>
                        </div>
                        <ToggleRow label="Ata de Vistoria" checked={ataVistoriaAba2} onChange={setAtaVistoriaAba2} id="ata-vistoria-aba2" />
                        <ToggleRow label="Planilha de Prejuízo" checked={planilhaPrejuizoAba2} onChange={setPlanilhaPrejuizoAba2} id="planilha-prejuizo-aba2" />
                        <div className="space-y-2">
                          <Label>Identificação do Ano e Modelo</Label>
                          <Input placeholder="Ex: 2020, Volvo FH" value={identificacaoAnoModelo} onChange={e => setIdentificacaoAnoModelo(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Vistoria na Lona e Veículo</Label>
                          <RadioGroup value={vistoriaLonaAba2} onValueChange={(v: any) => setVistoriaLonaAba2(v)}>
                            <div className="flex items-center space-x-2 p-2 rounded border border-border">
                              <RadioGroupItem value="sim" id="vistoria-lona-sim" />
                              <Label htmlFor="vistoria-lona-sim" className="cursor-pointer">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded border border-border">
                              <RadioGroupItem value="nao" id="vistoria-lona-nao" />
                              <Label htmlFor="vistoria-lona-nao" className="cursor-pointer">Não</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded border border-border">
                              <RadioGroupItem value="na" id="vistoria-lona-na" />
                              <Label htmlFor="vistoria-lona-na" className="cursor-pointer">N/A</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label>Ressalva em Casos de Recusa</Label>
                          <Textarea placeholder="Descreva a ressalva..." value={ressalvaRecusa} onChange={e => setRessalvaRecusa(e.target.value)} rows={2} />
                        </div>
                        <ToggleRow label="Acionamento de Perícia" checked={acionamentoPericia} onChange={setAcionamentoPericia} id="acionamento-pericia-aba2" />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              <Separator />
              <SectionTitle>Tacógrafo</SectionTitle>
              <RadioGroup value={tacografo} onValueChange={(v: any) => setTacografo(v)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                  <RadioGroupItem value="sim" id="taco-sim" />
                  <Label htmlFor="taco-sim" className="flex-1 cursor-pointer">Sim</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                  <RadioGroupItem value="nao" id="taco-nao" />
                  <Label htmlFor="taco-nao" className="flex-1 cursor-pointer">Não</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                  <RadioGroupItem value="nao_necessario" id="taco-na" />
                  <Label htmlFor="taco-na" className="flex-1 cursor-pointer">Não necessário</Label>
                </div>
              </RadioGroup>

              {tacografo === 'nao' && (
                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Select value={motivoTacografo} onValueChange={setMotivoTacografo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{MOTIVOS_TACOGRAFO_NAO_COLETADO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Velocidade Registrada</Label>
                  <Select value={velRegistrada} onValueChange={setVelRegistrada}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FAIXAS_VELOCIDADE.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Velocidade Permitida</Label>
                  <Select value={velPermitida} onValueChange={setVelPermitida}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{VELOCIDADES_PERMITIDAS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <ToggleRow label="Disco Vencido" checked={discoVencido} onChange={setDiscoVencido} id="disco-vencido" />
                </div>
              </div>
            </>
          )}

          {/* ============ ABA 3: CHECKLIST ============ */}
          {step === 3 && (
            <>
              <ToggleRow label="Documentos/Fotos Analisados" checked={docsFotos} onChange={setDocsFotos} id="docs-fotos" />
              <ToggleRow label="Custos Aprovados" checked={custosAprovados} onChange={setCustosAprovados} id="custos" />
              <ToggleRow label="Vistoriador Encerrado" checked={vistoriadorEncerrado} onChange={setVistoriadorEncerrado} id="vistoriador" />
              <ToggleRow label="Ata Conferida" checked={ataConferida} onChange={setAtaConferida} id="ata" />



              <div className="space-y-2">
                <Label>Salvados Lançados</Label>
                <Select value={salvadosLancados} onValueChange={setSalvadosLancados}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SALVADOS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <Separator />
              <ToggleRow label="Não Conformidade" checked={naoConformidade} onChange={setNaoConformidade} id="nc" />
              
              {naoConformidade && (
                <div className="space-y-2">
                  <Label>Descrição da NC *</Label>
                  <Select value={naoConformidadeDesc} onValueChange={setNaoConformidadeDesc}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{NAO_CONFORMIDADE_DESCRICOES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}





              <Separator />
              <ToggleRow label="Mercadorias/Equip. sem Info" checked={mercadoriasSemInfo} onChange={setMercadoriasSemInfo} id="merc-info" />
              <ToggleRow label="Limpeza de Pista sem Tratativas" checked={limpezaPista} onChange={setLimpezaPista} id="limpeza" />
              <ToggleRow label="Perícia Sindicante" checked={pericia} onChange={setPericia} id="pericia" />

            </>
          )}

          {/* ============ ABA 4: PREJUÍZO ============ */}
          {step === 4 && (
            <>
              <ToggleRow label="Prejuízo Apurado" checked={prejuizoApurado} onChange={setPrejuizoApurado} id="prejuizo" />
              
              {!prejuizoApurado && (
                <div className="space-y-2">
                  <Label>Motivo *</Label>
                  <Select value={motivoPrejuizo} onValueChange={setMotivoPrejuizo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{MOTIVOS_PREJUIZO_NAO_APURADO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {prejuizoApurado && (
                <>
                  <Separator />
                  <SectionTitle>Memória de Cálculo</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Embarcado (R$)</Label>
                      <Input type="number" value={totalEmbarcado} onChange={e => setTotalEmbarcado(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Recebido (R$)</Label>
                      <Input type="number" value={totalRecebido} onChange={e => setTotalRecebido(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Recusado (R$)</Label>
                      <Input type="number" value={totalRecusado} onChange={e => setTotalRecusado(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Salvados (R$)</Label>
                      <Input type="number" value={salvadosValor} onChange={e => setSalvadosValor(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Falta / Saque (R$)</Label>
                      <Input type="number" value={faltaSaque} onChange={e => setFaltaSaque(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="text-sm text-muted-foreground mb-1">Memória de Cálculo</div>
                    <div className="text-2xl font-bold text-primary">
                      R$ {memoriaCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <Separator />
                  <SectionTitle>Ajuste de Reserva</SectionTitle>
                  <RadioGroup value={alteracaoReserva ? 'sim' : 'nao'} onValueChange={(v) => setAlteracaoReserva(v === 'sim')}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                      <RadioGroupItem value="sim" id="reserva-sim" />
                      <Label htmlFor="reserva-sim" className="flex-1 cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                      <RadioGroupItem value="nao" id="reserva-nao" />
                      <Label htmlFor="reserva-nao" className="flex-1 cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </>
              )}
            </>
          )}

          {/* ============ ABA 5: FINALIZAR ============ */}
          {step === 5 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modelo Finalizar Central</Label>
                  <Select value={modelo} onValueChange={setModelo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{MODELOS_FINALIZAR_CENTRAL.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tempo/Causa do Evento</Label>
                  <Select value={causa} onValueChange={setCausa}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{CAUSAS_EVENTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <SectionTitle>Confirmações</SectionTitle>
              <ToggleRow label="Documentação Recebida" checked={docsFotos} onChange={setDocsFotos} id="doc-recebida-final" />
              <ToggleRow label="Fotos Recebidas e Analisadas" checked={ataConferida} onChange={setAtaConferida} id="fotos-final" />
              <ToggleRow label="Custos Aprovados" checked={custosAprovados} onChange={setCustosAprovados} id="custos-final" />
              <p className="text-xs text-muted-foreground -mt-2">Caso os custos ultrapassem a autonomia, informar se houve deliberação/autorização da companhia</p>
              <ToggleRow label="Histórico Completo Lançado" checked={vistoriadorEncerrado} onChange={setVistoriadorEncerrado} id="historico-final" />
              <ToggleRow label="Limpeza de Pista" checked={limpezaPista} onChange={setLimpezaPista} id="limpeza-final" />
              <ToggleRow label="Acionamento de Perícia/Sindicância" checked={pericia} onChange={setPericia} id="pericia-final" />

              <Separator />
              <SectionTitle>Situação Final</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Situação final do veículo</Label>
                  <Select value={situacaoVeiculo} onValueChange={setSituacaoVeiculo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{SITUACAO_VEICULO_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condições da mercadoria</Label>
                  <Select value={condicoesMerc} onValueChange={setCondicoesMerc}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{CONDICOES_MERCADORIA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destinação da mercadoria</Label>
                  <Select value={destinacaoMerc} onValueChange={setDestinacaoMerc}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{DESTINACAO_MERCADORIA_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Providências tomadas</Label>
                  <Textarea placeholder="Descreva as providências..." value={providenciasTomadas} onChange={e => setProvidenciasTomadas(e.target.value)} rows={2} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resumo do atendimento</Label>
                <Textarea placeholder="Resumo geral do atendimento..." value={descricaoAtend} onChange={e => setDescricaoAtend(e.target.value)} rows={2} />
              </div>

              <Separator />
              <SectionTitle>Documentos Pendentes</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {DOCUMENTOS_PENDENTES_ITEMS.map(doc => (
                  <CheckItem key={doc} label={doc} checked={docsPendentes.includes(doc)} onChange={() => toggleList(docsPendentes, setDocsPendentes, doc)} />
                ))}
              </div>

              <Separator />
              <div className="space-y-2">
                <Label>Observações finais (opcional)</Label>
                <Textarea placeholder="Observações adicionais..." value={obsAtend} onChange={e => setObsAtend(e.target.value)} rows={2} />
              </div>
            </>
          )}





          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground">Etapa {step} de {STEPS.length}</span>
            {step < STEPS.length ? (
              <Button onClick={() => setStep(s => s + 1)} className="gap-1.5">
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4" /> Criar Processo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Assinatura Digital */}
      <Dialog open={showAssinaturaDialog} onOpenChange={setShowAssinaturaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-5 h-5 text-primary" />
              Assinatura Digital
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Digite sua assinatura digital para confirmar a criação do processo e gerar o relatório PDF.
            </p>
            <div className="space-y-2">
              <Label>Sua Assinatura</Label>
              <Input
                placeholder="Ex: Vinicius Oliveira"
                value={assinatura}
                onChange={e => setAssinatura(e.target.value)}
                className="font-semibold"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAssinaturaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssinatura} className="gap-1.5 bg-primary">
              <FileDown className="w-4 h-4" /> Gerar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Operador */}
      <Dialog open={showAddOperador} onOpenChange={setShowAddOperador}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Operador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nome do novo operador</Label>
            <Input placeholder="Digite o nome..." value={novoOperador} onChange={e => setNovoOperador(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddOperador(false); setNovoOperador(''); }}>Cancelar</Button>
            <Button onClick={() => { if (novoOperador.trim()) { setCustomOperadores(prev => [...prev, novoOperador.trim()]); setOperador(novoOperador.trim()); setNovoOperador(''); setShowAddOperador(false); toast.success('Operador adicionado!'); } }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Causa */}
      <Dialog open={showAddCausa} onOpenChange={setShowAddCausa}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Causa do Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nova causa do evento</Label>
            <Input placeholder="Digite a causa..." value={novaCausa} onChange={e => setNovaCausa(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddCausa(false); setNovaCausa(''); }}>Cancelar</Button>
            <Button onClick={() => { if (novaCausa.trim()) { setCustomCausas(prev => [...prev, novaCausa.trim()]); setCausa(novaCausa.trim()); setNovaCausa(''); setShowAddCausa(false); toast.success('Causa adicionada!'); } }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Seguradora */}
      <Dialog open={showAddSeguradora} onOpenChange={setShowAddSeguradora}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Seguradora</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nome da nova seguradora</Label>
            <Input placeholder="Digite o nome da seguradora..." value={novaSeguradora} onChange={e => setNovaSeguradora(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSeguradora(false); setNovaSeguradora(''); }}>Cancelar</Button>
            <Button onClick={() => { if (novaSeguradora.trim()) { setCustomSeguradoras(prev => [...prev, novaSeguradora.trim()]); setSeguradora(novaSeguradora.trim()); setNovaSeguradora(''); setShowAddSeguradora(false); toast.success('Seguradora adicionada!'); } }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
