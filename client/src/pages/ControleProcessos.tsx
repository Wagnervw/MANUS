import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, parse, addDays, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileUp, Loader2, Sparkles, Trash2, AlertCircle, CheckCircle2, 
  ClipboardList, Calendar, BellRing, Target, Clock, AlertTriangle, 
  LayoutGrid, List, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Carrega o motor do PDF direto do sistema local (sem usar a internet/CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ProcessoControle {
  id: string;
  numero: string;
  segurado: string;
  seguradora: string;
  conducao: string;
  recebimento: string;
  tipoEvento: string;
  mercadoria: string;
  preliminar: string;
  email: string;
  custos: string;
  salvados: string;
  finCentral: string;
  cobrancaDocs: string;
  decurso: string;
  origemPdf?: boolean;
}

type EditableField = keyof Omit<ProcessoControle, 'id' | 'origemPdf'>;

// ==========================================
// HELPERS E REGRAS DE NEGÓCIO
// ==========================================

const parseDataBr = (dataStr: string) => {
  if (!dataStr) return new Date();
  try {
    return parse(dataStr, 'dd/MM/yyyy', new Date());
  } catch {
    return new Date();
  }
};

const calcularPrazos = (recebimento: string) => {
  const dtRecebimento = parseDataBr(recebimento);
  return {
    preliminar: addDays(dtRecebimento, 3),
    cobrancaDocs: addDays(dtRecebimento, 5),
    finCentral: addDays(dtRecebimento, 15),
  };
};

const getStatusColor = (val: string) => {
  const v = val?.toLowerCase().trim();
  if (v === 'ok') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (v === 'x') return 'bg-red-500/15 text-red-500 border-red-500/30';
  if (v === 'na' || v === 'n/a') return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
};

const calcularProgresso = (p: ProcessoControle) => {
  const campos = ['preliminar', 'email', 'custos', 'salvados', 'cobrancaDocs', 'finCentral'];
  let concluidos = 0;
  campos.forEach(c => {
    const val = (p[c as keyof ProcessoControle] as string)?.toLowerCase().trim();
    if (val && val !== 'pendente' && val !== 'x') concluidos++;
  });
  return Math.round((concluidos / campos.length) * 100);
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ControleProcessos() {
  const [processos, setProcessos] = useState<ProcessoControle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filtroAtivo, setFiltroAtivo] = useState<string>('Todos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [form, setForm] = useState({ numero: '', segurado: '', seguradora: '', conducao: '', recebimento: '', tipoEvento: '', mercadoria: '' });

  // Carregar dados
  useEffect(() => {
    loadProcessos();
  }, []);

  async function loadProcessos() {
    const { data, error } = await supabase.from('processos_controle').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProcessos(data.map(r => ({
        id: r.id, numero: r.numero || '', segurado: r.segurado || '', seguradora: r.seguradora || '',
        conducao: r.conducao || '', recebimento: r.recebimento || '', tipoEvento: r.tipo_evento || '',
        mercadoria: r.mercadoria || '', preliminar: r.preliminar || '', email: r.email || '',
        custos: r.custos || '', salvados: r.salvados || '', finCentral: r.fin_central || '',
        cobrancaDocs: r.cobranca_docs || '', decurso: r.decurso || '', origemPdf: r.origem_pdf || false
      })));
    }
    setLoading(false);
  }

  const updateField = async (id: string, field: EditableField, value: string) => {
    setProcessos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    const snakeField = field === 'tipoEvento' ? 'tipo_evento' : field === 'finCentral' ? 'fin_central' : field === 'cobrancaDocs' ? 'cobranca_docs' : field;
    await supabase.from('processos_controle').update({ [snakeField]: value, updated_at: new Date().toISOString() }).eq('id', id);
  };

  // Lógica do PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setProcessandoPdf(true);
    let processosAtualizados = [...processos];

    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "SUA_CHAVE_AQUI";
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      for (const file of files) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const imageParts = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;
            canvas.height = viewport.height; canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            imageParts.push({ inlineData: { data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], mimeType: "image/jpeg" } });
          }

          const promptText = `Você é um assistente da Wagner Reguladora. Analise as imagens do aviso preliminar. Retorne APENAS um JSON: { "numero": "...", "segurado": "...", "seguradora": "...", "conducao": "1º nome", "recebimento": "DD/MM/AAAA", "tipoEvento": "Atendimento ou Vistoria", "mercadoria": "..." }. Se vazio, use "".`;
          const result = await model.generateContent([promptText, ...imageParts]);
          const dados = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

          const novo: ProcessoControle = {
            id: crypto.randomUUID(), numero: dados.numero || `PDF-${Date.now()}`,
            segurado: dados.segurado || '', seguradora: dados.seguradora || '', conducao: dados.conducao || '',
            recebimento: dados.recebimento || new Date().toLocaleDateString('pt-BR'), tipoEvento: dados.tipoEvento || '',
            mercadoria: dados.mercadoria || '', preliminar: '', email: '', custos: '', salvados: '', finCentral: '', cobrancaDocs: '', decurso: '', origemPdf: true
          };

          if (!processosAtualizados.some(p => p.numero === novo.numero)) {
            await supabase.from('processos_controle').insert({
              id: novo.id, numero: novo.numero, segurado: novo.segurado, seguradora: novo.seguradora, conducao: novo.conducao,
              recebimento: novo.recebimento, tipo_evento: novo.tipoEvento, mercadoria: novo.mercadoria, origem_pdf: true
            });
            processosAtualizados.push(novo);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setProcessos(processosAtualizados);
      toast.success("Importação concluída");
    } catch (err) {
      toast.error("Erro na API do Google");
    } finally {
      setProcessandoPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Motor de Alertas e Metas
  const hoje = new Date();
  const processosFiltrados = useMemo(() => {
    let filtrados = processos;
    if (filtroAtivo === 'Vencendo Hoje') {
      filtrados = processos.filter(p => {
        const prazos = calcularPrazos(p.recebimento);
        return isToday(prazos.preliminar) || isToday(prazos.cobrancaDocs) || isToday(prazos.finCentral);
      });
    } else if (filtroAtivo === 'Pendente docs') {
      filtrados = processos.filter(p => !p.cobrancaDocs || p.cobrancaDocs.toLowerCase() === 'pendente');
    } else if (filtroAtivo === 'Salvados pendentes') {
      filtrados = processos.filter(p => p.salvados.toLowerCase() === 'pendente' || !p.salvados);
    } else if (filtroAtivo === 'Custos X') {
      filtrados = processos.filter(p => p.custos.toLowerCase() === 'x');
    }
    return filtrados;
  }, [processos, filtroAtivo]);

  const stats = useMemo(() => {
    const ativos = processos.filter(p => p.finCentral?.toLowerCase() !== 'ok' && p.finCentral?.toLowerCase() !== 'na');
    const finalizados = processos.length - ativos.length;
    const alertas = processos.filter(p => {
      const pz = calcularPrazos(p.recebimento);
      return (isPast(pz.finCentral) && p.finCentral?.toLowerCase() !== 'ok') || p.custos.toLowerCase() === 'x' || p.salvados.toLowerCase() === 'x';
    });
    return { ativos: ativos.length, finalizados, meta: 50, alertas: alertas.length };
  }, [processos]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER COCKPIT */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Target className="w-8 h-8 text-violet-500" />
            Centro de Controle Inteligente
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Cockpit operacional - Wagner Reguladora</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-muted/50 p-1 rounded-lg flex items-center">
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4 mr-2"/> Lista</Button>
            <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')}><LayoutGrid className="w-4 h-4 mr-2"/> Kanban</Button>
          </div>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={processandoPdf} className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
            {processandoPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />} Importar PDF
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} multiple />
        </div>
      </div>

      {/* MINI-PAINEL DE METAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl"><ClipboardList className="w-6 h-6 text-blue-500" /></div>
            <div><p className="text-sm text-muted-foreground">Processos Ativos</p><h3 className="text-2xl font-bold">{stats.ativos}</h3></div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
            <div><p className="text-sm text-muted-foreground">Finalizados (Mês)</p><h3 className="text-2xl font-bold">{stats.finalizados}</h3></div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-border/50 md:col-span-2">
          <CardContent className="p-4 flex flex-col justify-center h-full space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Meta Mensal ({stats.meta})</span>
              <span className="font-bold text-emerald-500">{Math.round((stats.finalizados / stats.meta) * 100)}%</span>
            </div>
            <Progress value={(stats.finalizados / stats.meta) * 100} className="h-2 bg-muted/50 [&>div]:bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* ALERTAS INTELIGENTES */}
      {stats.alertas > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-500 text-sm">Atenção Necessária</h4>
            <p className="text-sm text-red-400/80">Você tem {stats.alertas} processo(s) com prazos vencidos ou itens críticos marcados com "X". Verifique a lista.</p>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-muted-foreground mr-2" />
        {['Todos', 'Vencendo Hoje', 'Pendente docs', 'Salvados pendentes', 'Custos X'].map(f => (
          <Badge 
            key={f} 
            variant="outline" 
            className={cn("cursor-pointer px-3 py-1.5 whitespace-nowrap", filtroAtivo === f ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted")}
            onClick={() => setFiltroAtivo(f)}
          >
            {f}
          </Badge>
        ))}
      </div>

      {/* CONTEÚDO (LISTA/KANBAN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {processosFiltrados.map(p => {
          const progresso = calcularProgresso(p);
          const prazos = calcularPrazos(p.recebimento);
          const diasFaltando = differenceInDays(prazos.finCentral, hoje);
          
          let borderColor = "border-border/40";
          if (p.finCentral?.toLowerCase() !== 'ok') {
            if (diasFaltando < 0) borderColor = "border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]";
            else if (diasFaltando <= 2) borderColor = "border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]";
          }

          return (
            <Card key={p.id} className={cn("bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 group", borderColor)}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-mono font-bold text-lg text-primary">{p.numero}</h3>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{p.segurado}</p>
                    <p className="text-xs text-muted-foreground">{p.seguradora}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{p.tipoEvento}</Badge>
                </div>

                {/* Status Rápidos */}
                <div className="flex gap-2 mb-4">
                  <div className={cn("text-[10px] px-2 py-1 rounded-md border font-medium flex-1 text-center", getStatusColor(p.custos))}>
                    Custos: {p.custos || 'N/A'}
                  </div>
                  <div className={cn("text-[10px] px-2 py-1 rounded-md border font-medium flex-1 text-center", getStatusColor(p.salvados))}>
                    Salvados: {p.salvados || 'N/A'}
                  </div>
                </div>

                {/* Progress Checklist */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Checklist</span>
                    <span className="font-bold">{progresso}%</span>
                  </div>
                  <Progress value={progresso} className="h-1.5 bg-muted" />
                </div>

                {/* Engine de Prazos */}
                <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" /> Rec: {p.recebimento}
                  </div>
                  <div className={cn("flex items-center gap-1.5 font-medium", diasFaltando < 0 ? "text-red-500" : diasFaltando <= 2 ? "text-amber-500" : "text-emerald-500")}>
                    <Clock className="w-3.5 h-3.5" /> 
                    {p.finCentral?.toLowerCase() === 'ok' ? 'Finalizado' : 
                     diasFaltando < 0 ? `Atrasado ${Math.abs(diasFaltando)}d` : 
                     `Prazo: ${diasFaltando} dias`}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
    </div>
  );
}
