import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcessos } from '@/contexts/SinistrosContext';
import { generateProcessoReport } from '@/lib/generateReport';
import { supabase } from '@/lib/supabase';
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
import { Check, ChevronLeft, ChevronRight, FileText, Search, ClipboardCheck, Calculator, Flag, Phone, FileDown, PenLine, Plus, TriangleAlert as AlertTriangle } from 'lucide-react';

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

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const DRAFT_KEY = 'wagner-finalizacao-central-draft';

function extractMaxSpeed(faixa: string): number | null {
  if (!faixa || faixa === 'Não registrada' || faixa === 'Não identificada') return null;
  if (faixa.startsWith('Acima de')) return 121;
  if (faixa.startsWith('Até')) {
    const match = faixa.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  const rangeMatch = faixa.match(/(\d+)\s*a\s*(\d+)/);
  if (rangeMatch) return parseInt(rangeMatch[2]);
  const singleMatch = faixa.match(/^(\d+)/);
  if (singleMatch) return parseInt(singleMatch[1]);
  return null;
}

function extractPermittedSpeed(vel: string): number | null {
  if (!vel || vel === 'Não identificada') return null;
  const match = vel.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export default function FinalizacaoCentral() {
  const { id: controleId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addProcesso, updateProcesso, getProcesso } = useProcessos();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [showAssinaturaDialog, setShowAssinaturaDialog] = useState(false);
  const [assinatura, setAssinatura] = useState('');
  const [loadingControle, setLoadingControle] = useState(!!controleId);
  const [existingProcessoId, setExistingProcessoId] = useState<string | null>(null);

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  }, [step]);

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

  // Pre-fill from processos_controle when arriving via /finalizar/:id
  const prefillDone = useRef(false);
  useEffect(() => {
    if (!controleId || prefillDone.current) return;
    prefillDone.current = true;

    (async () => {
      const { data, error } = await supabase
        .from('processos_controle')
        .select('*')
        .eq('id', controleId)
        .maybeSingle();

      if (error || !data) {
        toast.error('Processo nao encontrado no controle');
        setLoadingControle(false);
        return;
      }

      setNumero(data.numero || '');
      setSegurado(data.segurado || '');
      setSeguradora(data.seguradora || '');

      // Check if a full processo already exists with this number
      const existing = getProcesso(controleId);
      if (existing) {
        setExistingProcessoId(existing.id);
      }

      setLoadingControle(false);
      toast.info('Dados do processo preenchidos automaticamente');
    })();
  }, [controleId, getProcesso]);

  // ---- Aba 2: Vistoria / Atendimento ----
  // Atendimento fields
  const [resumoAcionamento, setResumoAcionamento] = useState('');
  const [resumoAtendimento, setResumoAtendimento] = useState('');
  const [situacaoVeiculoAba2, setSituacaoVeiculoAba2] = useState('');
  const [condicoesMercadoriaAba2, setCondicoesMercadoriaAba2] = useState('');
  const [providenciasTomadas, setProvidenciasTomadas] = useState('');
  const [destinacaoMercadoriaAba2, setDestinacaoMercadoriaAba2] = useState('');
  const [limpezaPistaAba2, setLimpezaPistaAba2] = useState(false);
  const [localEventoAba2, setLocalEventoAba2] = useState('');
  
  // Vistoria fields
  const [ataVistoriaAba2, setAtaVistoriaAba2] = useState(false);
  const [inventarioSalvados, setInventarioSalvados] = useState(false);
  const [documentosAssinados, setDocumentosAssinados] = useState(true);
  const [documentosAssinadosJustificativa, setDocumentosAssinadosJustificativa] = useState('');
  const [mercadoriaNovaOuUsada, setMercadoriaNovaOuUsada] = useState('');
  const [identificacaoAnoModelo, setIdentificacaoAnoModelo] = useState(false);
  const [fotosEtiqueta, setFotosEtiqueta] = useState(false);
  const [fotosOdometro, setFotosOdometro] = useState(false);
  const [orcamentoReparo, setOrcamentoReparo] = useState(false);
  const [lonaVeiculoInspecionados, setLonaVeiculoInspecionados] = useState(false);
  const [furosNaLona, setFurosNaLona] = useState(false);
  const [todasLonasInspecionadas, setTodasLonasInspecionadas] = useState(false);
  const [ressalvaRecusa, setRessalvaRecusa] = useState('');
  const [acionamentoPericia, setAcionamentoPericia] = useState(false);
  const [acionamentoSindicancia, setAcionamentoSindicancia] = useState(false);
  
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
  const [ataConferida, setAtaConferida] = useState(false);
  
  const [custosLancados, setCustosLancados] = useState(false);
  const [custosUltrapassaram, setCustosUltrapassaram] = useState<'sim' | 'nao' | ''>('');
  const [seguradoraNotificada, setSeguradoraNotificada] = useState(false);
  const [infoComplementaresLancadas, setInfoComplementaresLancadas] = useState(false);
  const [alteracaoReserva, setAlteracaoReserva] = useState(false);

  // ---- Aba 4: Prejuízo ----
  const [prejuizoApurado, setPrejuizoApurado] = useState(true);
  const [motivoPrejuizo, setMotivoPrejuizo] = useState('');
  const [totalEmbarcado, setTotalEmbarcado] = useState<number | ''>('');
  const [totalRecebido, setTotalRecebido] = useState<number | ''>('');
  const [totalRecusado, setTotalRecusado] = useState<number | ''>('');
  const [salvadosValor, setSalvadosValor] = useState<number | ''>('');
  const [dispersaoSaque, setDispersaoSaque] = useState<number | ''>('');

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
    const emb = Number(totalEmbarcado) || 0;
    const rec = Number(totalRecebido) || 0;
    const rec2 = Number(totalRecusado) || 0;
    const salv = Number(salvadosValor) || 0;
    return emb - rec - rec2 - salv;
  }, [totalEmbarcado, totalRecebido, totalRecusado, salvadosValor]);

  const temAtraso = useMemo(() => {
    if (!dataEncVistoria || !dataEncFinalizar) return false;
    return new Date(dataEncFinalizar) > new Date(dataEncVistoria);
  }, [dataEncVistoria, dataEncFinalizar]);

  const completionPercent = useMemo(() => {
    let filled = 0;
    let total = 0;
    // Step 1 fields
    total += 4;
    if (numero) filled++;
    if (operador) filled++;
    if (segurado) filled++;
    if (seguradora) filled++;
    // Step 2 fields
    total += 3;
    if (resumoAcionamento) filled++;
    if (situacaoVeiculoAba2) filled++;
    if (condicoesMercadoriaAba2) filled++;
    // Step 3 fields
    total += 3;
    if (docsFotos) filled++;
    if (custosAprovados) filled++;
    if (ataConferida) filled++;
    // Step 4 fields
    total += 2;
    if (totalEmbarcado !== '') filled++;
    if (totalRecebido !== '') filled++;
    // Step 5 fields
    total += 1;
    if (modelo) filled++;
    // Base step progress (each visited step adds weight)
    const stepWeight = ((step - 1) / STEPS.length) * 30;
    const fieldWeight = (filled / total) * 70;
    return Math.min(Math.round(stepWeight + fieldWeight), 100);
  }, [numero, operador, segurado, seguradora, resumoAcionamento, situacaoVeiculoAba2, condicoesMercadoriaAba2, docsFotos, custosAprovados, ataConferida, totalEmbarcado, totalRecebido, modelo, step]);

  const animatedMemoria = useCountUp(memoriaCalculo);

  // Smart warning: speed comparison
  const speedWarning = useMemo(() => {
    const registered = extractMaxSpeed(velRegistrada);
    const permitted = extractPermittedSpeed(velPermitida);
    if (registered === null || permitted === null) return false;
    return registered > permitted;
  }, [velRegistrada, velPermitida]);

  // Auto-disable orcamento when vehicle situation is "Perda Total"
  useEffect(() => {
    if (situacaoVeiculoAba2.includes('Perda Total') || condicoesMercadoriaAba2 === 'Perda Total') {
      setOrcamentoReparo(false);
    }
  }, [situacaoVeiculoAba2, condicoesMercadoriaAba2]);

  // localStorage auto-save draft
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftState = useMemo(() => ({
    numero, operador, segurado, seguradora, causa, dataEncVistoria, dataEncFinalizar,
    resumoAcionamento, resumoAtendimento, situacaoVeiculoAba2, condicoesMercadoriaAba2,
    providenciasTomadas, destinacaoMercadoriaAba2, limpezaPistaAba2, localEventoAba2,
    ataVistoriaAba2, inventarioSalvados, documentosAssinados, documentosAssinadosJustificativa,
    mercadoriaNovaOuUsada, identificacaoAnoModelo, fotosEtiqueta, fotosOdometro, orcamentoReparo,
    lonaVeiculoInspecionados, furosNaLona, todasLonasInspecionadas, ressalvaRecusa,
    acionamentoPericia, acionamentoSindicancia, justificativaAtraso, atendimentoVistoria,
    tacografo, motivoTacografo, velRegistrada, velPermitida, discoVencido,
    docsFotos, custosAprovados, ataConferida, custosLancados, custosUltrapassaram,
    seguradoraNotificada, infoComplementaresLancadas, alteracaoReserva,
    prejuizoApurado, motivoPrejuizo, totalEmbarcado, totalRecebido, totalRecusado,
    salvadosValor, dispersaoSaque, modelo, bo, discoTacografo, parecer,
    acionamento, realizadoPor, horario, atendimentoInLoco, situacaoVeiculo,
    condicoesMerc, destinacaoMerc, descricaoAtend, obsAtend, docsPendentes, vistoriaFinal, step,
  }), [
    numero, operador, segurado, seguradora, causa, dataEncVistoria, dataEncFinalizar,
    resumoAcionamento, resumoAtendimento, situacaoVeiculoAba2, condicoesMercadoriaAba2,
    providenciasTomadas, destinacaoMercadoriaAba2, limpezaPistaAba2, localEventoAba2,
    ataVistoriaAba2, inventarioSalvados, documentosAssinados, documentosAssinadosJustificativa,
    mercadoriaNovaOuUsada, identificacaoAnoModelo, fotosEtiqueta, fotosOdometro, orcamentoReparo,
    lonaVeiculoInspecionados, furosNaLona, todasLonasInspecionadas, ressalvaRecusa,
    acionamentoPericia, acionamentoSindicancia, justificativaAtraso, atendimentoVistoria,
    tacografo, motivoTacografo, velRegistrada, velPermitida, discoVencido,
    docsFotos, custosAprovados, ataConferida, custosLancados, custosUltrapassaram,
    seguradoraNotificada, infoComplementaresLancadas, alteracaoReserva,
    prejuizoApurado, motivoPrejuizo, totalEmbarcado, totalRecebido, totalRecusado,
    salvadosValor, dispersaoSaque, modelo, bo, discoTacografo, parecer,
    acionamento, realizadoPor, horario, atendimentoInLoco, situacaoVeiculo,
    condicoesMerc, destinacaoMerc, descricaoAtend, obsAtend, docsPendentes, vistoriaFinal, step,
  ]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftState)); } catch {}
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [draftState]);

  // Restore draft on mount
  const draftRestored = useRef(false);
  useEffect(() => {
    if (draftRestored.current) return;
    draftRestored.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.numero) setNumero(d.numero);
      if (d.operador) setOperador(d.operador);
      if (d.segurado) setSegurado(d.segurado);
      if (d.seguradora) setSeguradora(d.seguradora);
      if (d.causa) setCausa(d.causa);
      if (d.dataEncVistoria) setDataEncVistoria(d.dataEncVistoria);
      if (d.dataEncFinalizar) setDataEncFinalizar(d.dataEncFinalizar);
      if (d.resumoAcionamento) setResumoAcionamento(d.resumoAcionamento);
      if (d.resumoAtendimento) setResumoAtendimento(d.resumoAtendimento);
      if (d.situacaoVeiculoAba2) setSituacaoVeiculoAba2(d.situacaoVeiculoAba2);
      if (d.condicoesMercadoriaAba2) setCondicoesMercadoriaAba2(d.condicoesMercadoriaAba2);
      if (d.providenciasTomadas) setProvidenciasTomadas(d.providenciasTomadas);
      if (d.destinacaoMercadoriaAba2) setDestinacaoMercadoriaAba2(d.destinacaoMercadoriaAba2);
      if (d.limpezaPistaAba2 !== undefined) setLimpezaPistaAba2(d.limpezaPistaAba2);
      if (d.localEventoAba2) setLocalEventoAba2(d.localEventoAba2);
      if (d.ataVistoriaAba2 !== undefined) setAtaVistoriaAba2(d.ataVistoriaAba2);
      if (d.inventarioSalvados !== undefined) setInventarioSalvados(d.inventarioSalvados);
      if (d.documentosAssinados !== undefined) setDocumentosAssinados(d.documentosAssinados);
      if (d.documentosAssinadosJustificativa) setDocumentosAssinadosJustificativa(d.documentosAssinadosJustificativa);
      if (d.mercadoriaNovaOuUsada) setMercadoriaNovaOuUsada(d.mercadoriaNovaOuUsada);
      if (d.identificacaoAnoModelo !== undefined) setIdentificacaoAnoModelo(d.identificacaoAnoModelo);
      if (d.fotosEtiqueta !== undefined) setFotosEtiqueta(d.fotosEtiqueta);
      if (d.fotosOdometro !== undefined) setFotosOdometro(d.fotosOdometro);
      if (d.orcamentoReparo !== undefined) setOrcamentoReparo(d.orcamentoReparo);
      if (d.lonaVeiculoInspecionados !== undefined) setLonaVeiculoInspecionados(d.lonaVeiculoInspecionados);
      if (d.furosNaLona !== undefined) setFurosNaLona(d.furosNaLona);
      if (d.todasLonasInspecionadas !== undefined) setTodasLonasInspecionadas(d.todasLonasInspecionadas);
      if (d.ressalvaRecusa) setRessalvaRecusa(d.ressalvaRecusa);
      if (d.acionamentoPericia !== undefined) setAcionamentoPericia(d.acionamentoPericia);
      if (d.acionamentoSindicancia !== undefined) setAcionamentoSindicancia(d.acionamentoSindicancia);
      if (d.justificativaAtraso) setJustificativaAtraso(d.justificativaAtraso);
      if (d.atendimentoVistoria) setAtendimentoVistoria(d.atendimentoVistoria);
      if (d.tacografo) setTacografo(d.tacografo);
      if (d.motivoTacografo) setMotivoTacografo(d.motivoTacografo);
      if (d.velRegistrada) setVelRegistrada(d.velRegistrada);
      if (d.velPermitida) setVelPermitida(d.velPermitida);
      if (d.discoVencido !== undefined) setDiscoVencido(d.discoVencido);
      if (d.docsFotos !== undefined) setDocsFotos(d.docsFotos);
      if (d.custosAprovados !== undefined) setCustosAprovados(d.custosAprovados);
      if (d.ataConferida !== undefined) setAtaConferida(d.ataConferida);
      if (d.custosLancados !== undefined) setCustosLancados(d.custosLancados);
      if (d.custosUltrapassaram) setCustosUltrapassaram(d.custosUltrapassaram);
      if (d.seguradoraNotificada !== undefined) setSeguradoraNotificada(d.seguradoraNotificada);
      if (d.infoComplementaresLancadas !== undefined) setInfoComplementaresLancadas(d.infoComplementaresLancadas);
      if (d.alteracaoReserva !== undefined) setAlteracaoReserva(d.alteracaoReserva);
      if (d.prejuizoApurado !== undefined) setPrejuizoApurado(d.prejuizoApurado);
      if (d.motivoPrejuizo) setMotivoPrejuizo(d.motivoPrejuizo);
      if (d.totalEmbarcado !== undefined && d.totalEmbarcado !== '') setTotalEmbarcado(d.totalEmbarcado);
      if (d.totalRecebido !== undefined && d.totalRecebido !== '') setTotalRecebido(d.totalRecebido);
      if (d.totalRecusado !== undefined && d.totalRecusado !== '') setTotalRecusado(d.totalRecusado);
      if (d.salvadosValor !== undefined && d.salvadosValor !== '') setSalvadosValor(d.salvadosValor);
      if (d.dispersaoSaque !== undefined && d.dispersaoSaque !== '') setDispersaoSaque(d.dispersaoSaque);
      if (d.modelo) setModelo(d.modelo);
      if (d.bo) setBo(d.bo);
      if (d.discoTacografo) setDiscoTacografo(d.discoTacografo);
      if (d.parecer) setParecer(d.parecer);
      if (d.acionamento) setAcionamento(d.acionamento);
      if (d.realizadoPor) setRealizadoPor(d.realizadoPor);
      if (d.horario) setHorario(d.horario);
      if (d.atendimentoInLoco !== undefined) setAtendimentoInLoco(d.atendimentoInLoco);
      if (d.situacaoVeiculo) setSituacaoVeiculo(d.situacaoVeiculo);
      if (d.condicoesMerc) setCondicoesMerc(d.condicoesMerc);
      if (d.destinacaoMerc) setDestinacaoMerc(d.destinacaoMerc);
      if (d.descricaoAtend) setDescricaoAtend(d.descricaoAtend);
      if (d.obsAtend) setObsAtend(d.obsAtend);
      if (d.docsPendentes) setDocsPendentes(d.docsPendentes);
      if (d.vistoriaFinal) setVistoriaFinal(d.vistoriaFinal);
      if (d.step) { setDirection(0); setStep(d.step); }
      toast.info('Rascunho restaurado automaticamente');
    } catch {}
  }, []);

  const handleSubmit = () => {
    if (!numero || !operador) {
      toast.error('Preencha o número do processo e selecione o operador');
      return;
    }
    setShowAssinaturaDialog(true);
  };

  const handleAssinatura = async () => {
    if (!assinatura.trim()) {
      toast.error('Digite sua assinatura digital');
      return;
    }

    const processoData = {
      numero, operador, segurado, seguradora, dataAbertura, status: 'Conclu\u00EDdo' as const,
      dataEncerramentoVistoriador: dataEncVistoria,
      dataEncerramentoFinalizarCentral: dataEncFinalizar,
      justificativaAtraso: temAtraso ? justificativaAtraso : '',
      atendimentoVistoria,
      tacografoColetado: tacografo,
      motivoTacografoNaoColetado: tacografo === 'nao' ? motivoTacografo : '',
      velocidadeRegistrada: velRegistrada,
      velocidadePermitida: velPermitida,
      discoVencido,
      documentosFotosRecebidos: docsFotos,
      custosAprovados,
      vistoriadorEncerrado: custosAprovados,
      tratativasEmailEncerradas: ataConferida,
      historicoStatus: '',
      salvadosLancados: '',
      naoConformidade: false,
      naoConformidadeDescricao: '',
      checklistEspecial: [],
      inventarioSalvados,
      planilhaPrejuizoJustificativa: '',
      mercadoriasSemInfo: false,
      limpezaPistaSemTratativas: false,
      periciaSindicante: false,
      alteracaoReserva,
      lonaVeiculoInspecionados,
      furosNaLona,
      todasLonasInspecionadas,
      acionamentoSindicancia,
      documentosAssinados,
      documentosAssinadosJustificativa: !documentosAssinados ? documentosAssinadosJustificativa : '',
      mercadoriaNovaOuUsada,
      identificacaoAnoModelo,
      fotosEtiquetaIdentificacao: fotosEtiqueta,
      fotosOdometro,
      orcamentoReparo,
      custosLancados,
      custosUltrapassaramAutonomia: custosUltrapassaram,
      seguradoraNotificada: custosUltrapassaram === 'sim' ? seguradoraNotificada : false,
      informacoesComplementaresLancadas: infoComplementaresLancadas,
      prejuizoApurado,
      motivoPrejuizoNaoApurado: !prejuizoApurado ? motivoPrejuizo : '',
      totalEmbarcado: Number(totalEmbarcado) || 0,
      totalRecebido: Number(totalRecebido) || 0,
      totalRecusado: Number(totalRecusado) || 0,
      salvadosValor: Number(salvadosValor) || 0,
      dispersaoSaque: Number(dispersaoSaque) || 0,
      modeloFinalizarCentral: modelo,
      causaEvento: causa,
      relatoMotorista: resumoAcionamento,
      resumoAtendimento,
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

    let processo;
    if (existingProcessoId) {
      await updateProcesso(existingProcessoId, processoData);
      processo = { ...processoData, id: existingProcessoId, historico: [] };
    } else {
      processo = await addProcesso(processoData);
    }

    // Mark fin_central = 'ok' on the processos_controle row
    if (controleId) {
      await supabase
        .from('processos_controle')
        .update({ fin_central: 'ok', updated_at: new Date().toISOString() })
        .eq('id', controleId);
    }

    await generateProcessoReport(processo, assinatura);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    toast.success('Finalizacao concluida e relatorio gerado com sucesso!');
    setShowAssinaturaDialog(false);
    navigate('/controle');
  };

  const canAdvance = () => {
    if (step === 1) return !!numero && !!operador;
    return true;
  };

  if (loadingControle) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky progress bar */}
      <div className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 pt-2 pb-3 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Progresso do formulario</span>
          <span className="text-xs font-bold text-primary">{completionPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
            initial={false}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
      </div>

      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground">Finalizacao Central</h1>
        <p className="text-sm text-muted-foreground mt-1">Preencha as informacoes em etapas para finalizar o processo{numero ? ` ${numero}` : ''}</p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-primary"
            initial={false}
            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          />
          {STEPS.map((s) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="relative flex flex-col items-center z-10">
                <motion.button
                  onClick={() => goToStep(s.id)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm cursor-pointer',
                    done ? 'bg-primary text-primary-foreground' : current ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {done ? <Check className="w-5 h-5" /> : s.id}
                </motion.button>
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
        <CardContent className="space-y-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-6"
          >
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
                          <Label>Relato do Motorista</Label>
                          <Textarea placeholder="Descreva o relato..." value={resumoAcionamento} onChange={e => setResumoAcionamento(e.target.value)} rows={2} />
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
                          <Label>Resumo do Atendimento</Label>
                          <Textarea placeholder="Descreva o resumo do atendimento..." value={resumoAtendimento} onChange={e => setResumoAtendimento(e.target.value)} rows={3} />
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
                          <Label>Local do Evento</Label>
                          <Textarea placeholder="Descreva o local onde ocorreu o evento..." value={localEventoAba2} onChange={e => setLocalEventoAba2(e.target.value)} rows={2} />
                        </div>

                        <div className="mt-6">
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
                            <div className="space-y-2 mt-4">
                              <Label>Motivo *</Label>
                              <Select value={motivoTacografo} onValueChange={setMotivoTacografo}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>{MOTIVOS_TACOGRAFO_NAO_COLETADO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                          {speedWarning && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 mt-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-red-700 dark:text-red-300">Excesso de velocidade detectado</span>
                            </motion.div>
                          )}
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
                        <ToggleRow label="Ata de Vistoria" checked={ataVistoriaAba2} onChange={setAtaVistoriaAba2} id="ata-vistoria-aba2" />
                        <ToggleRow label="Inventário de Salvados" checked={inventarioSalvados} onChange={setInventarioSalvados} id="inventario-salvados-aba2" />
                        <ToggleRow
                          label="Documentos acima foram assinados?"
                          checked={documentosAssinados}
                          onChange={setDocumentosAssinados}
                          id="documentos-assinados"
                        />
                        {!documentosAssinados && (
                          <div className="space-y-2">
                            <Label>Justificativa</Label>
                            <Textarea
                              placeholder="Justifique por que os documentos não foram assinados..."
                              value={documentosAssinadosJustificativa}
                              onChange={e => setDocumentosAssinadosJustificativa(e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}

                        <SectionTitle>Vistoria Equipamentos</SectionTitle>
                        <div className="space-y-2">
                          <Label>Mercadoria Nova ou Usada</Label>
                          <RadioGroup value={mercadoriaNovaOuUsada} onValueChange={setMercadoriaNovaOuUsada}>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                              <RadioGroupItem value="nova" id="merc-nova" />
                              <Label htmlFor="merc-nova" className="flex-1 cursor-pointer">Nova</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                              <RadioGroupItem value="usada" id="merc-usada" />
                              <Label htmlFor="merc-usada" className="flex-1 cursor-pointer">Usada</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <ToggleRow label="Identificação do Ano e Modelo" checked={identificacaoAnoModelo} onChange={setIdentificacaoAnoModelo} id="id-ano-modelo" />
                        <ToggleRow label="Fotos da Etiqueta de Identificação" checked={fotosEtiqueta} onChange={setFotosEtiqueta} id="fotos-etiqueta" />
                        <ToggleRow label="Fotos do Odômetro" checked={fotosOdometro} onChange={setFotosOdometro} id="fotos-odometro" />
                        {(situacaoVeiculoAba2.includes('Perda Total') || condicoesMercadoriaAba2 === 'Perda Total') ? (
                          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                            <div className="flex-1">
                              <Label className="text-sm font-medium text-amber-800 dark:text-amber-300">Orcamento de Reparo</Label>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Desabilitado automaticamente - Perda Total</p>
                            </div>
                            <Switch id="orcamento-reparo" checked={false} disabled />
                          </div>
                        ) : (
                          <ToggleRow label="Orçamento de Reparo" checked={orcamentoReparo} onChange={setOrcamentoReparo} id="orcamento-reparo" />
                        )}

                        <SectionTitle>Vistoria na Lona e Veículo</SectionTitle>
                        <ToggleRow label="Lona e Veículo Inspecionados" checked={lonaVeiculoInspecionados} onChange={setLonaVeiculoInspecionados} id="lona-inspecionada" />
                        <ToggleRow label="Furos na Lona" checked={furosNaLona} onChange={setFurosNaLona} id="furos-lona" />
                        <ToggleRow label="Todas as Lonas foram Inspecionadas" checked={todasLonasInspecionadas} onChange={setTodasLonasInspecionadas} id="todas-lonas" />

                        <div className="space-y-2 mt-4">
                          <Label>Ressalva em Casos de Recusa</Label>
                          <Textarea placeholder="Descreva a ressalva..." value={ressalvaRecusa} onChange={e => setRessalvaRecusa(e.target.value)} rows={2} />
                        </div>
                        <ToggleRow label="Acionamento de Perícia" checked={acionamentoPericia} onChange={setAcionamentoPericia} id="acionamento-pericia-aba2" />
                        <ToggleRow
                          label="Acionamento Sindicância"
                          checked={acionamentoSindicancia}
                          onChange={setAcionamentoSindicancia}
                          id="acionamento-sindicancia"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>


            </>
          )}

          {/* ============ ABA 3: CHECKLIST ============ */}
          {step === 3 && (
            <>
              <ToggleRow label="Documentos / Fotos Recebidos" checked={docsFotos} onChange={setDocsFotos} id="docs-fotos" />
              <ToggleRow label="Vistoriador Encerrado" checked={custosAprovados} onChange={setCustosAprovados} id="custos" />
              <ToggleRow label="Tratativas E-mail Encerradas" checked={ataConferida} onChange={setAtaConferida} id="ata" />

              <Separator />
              <SectionTitle>Custos</SectionTitle>

              <ToggleRow label="Custos Lançados" checked={custosLancados} onChange={setCustosLancados} id="custos-lancados" />

              <div className="space-y-3">
                <Label className="font-medium">Custos Ultrapassaram nossa Autonomia?</Label>
                
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    custosUltrapassaram === 'sim' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setCustosUltrapassaram('sim')}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    custosUltrapassaram === 'sim' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {custosUltrapassaram === 'sim' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium">Sim</span>
                </div>

                {custosUltrapassaram === 'sim' && (
                  <ToggleRow
                    label="Seguradora Notificada"
                    checked={seguradoraNotificada}
                    onChange={setSeguradoraNotificada}
                    id="seguradora-notificada"
                  />
                )}

                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    custosUltrapassaram === 'nao' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setCustosUltrapassaram('nao')}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    custosUltrapassaram === 'nao' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {custosUltrapassaram === 'nao' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium">Não</span>
                </div>
              </div>

              <ToggleRow
                label="Informações Complementares Lançadas"
                checked={infoComplementaresLancadas}
                onChange={setInfoComplementaresLancadas}
                id="info-complementares"
              />

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
                      <Input type="number" value={totalEmbarcado} onChange={e => setTotalEmbarcado(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Recebido (R$)</Label>
                      <Input type="number" value={totalRecebido} onChange={e => setTotalRecebido(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Recusado (R$)</Label>
                      <Input type="number" value={totalRecusado} onChange={e => setTotalRecusado(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Salvados (R$)</Label>
                      <Input type="number" value={salvadosValor} onChange={e => setSalvadosValor(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Dispersão / Saque (R$)</Label>
                      <Input type="number" value={dispersaoSaque} onChange={e => setDispersaoSaque(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                  </div>

                  <motion.div
                    className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30"
                    layout
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm text-muted-foreground mb-1">Memoria de Calculo</div>
                    <div className="text-2xl font-bold text-primary tabular-nums tracking-tight">
                      R$ {animatedMemoria.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </motion.div>

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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Modelo Finalizar Central</Label>
                  <Select value={modelo} onValueChange={setModelo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{MODELOS_FINALIZAR_CENTRAL.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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





          </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 1} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground">Etapa {step} de {STEPS.length}</span>
            {step < STEPS.length ? (
              <Button onClick={() => goToStep(step + 1)} className="gap-1.5">
                Proximo <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4" /> Finalizar Processo
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
