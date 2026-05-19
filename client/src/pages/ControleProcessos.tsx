import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FileUp, Loader as Loader2, Sparkles, Trash2, MoveVertical as MoreVertical, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, ClipboardList, ExternalLink, TriangleAlert as AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// ==========================================
// TYPES
// ==========================================

export interface ProcessoControle {
  id: string;
  numero: string;
  segurado: string;
  seguradora: string;
  conducao: string;
  recebimento: string;
  aberturaSinistro: string;
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
// COLUMNS CONFIG
// ==========================================

const INLINE_EDIT_COLUMNS: { key: EditableField; label: string; minW: string }[] = [
  { key: 'numero', label: 'N\u00B0 Processo', minW: 'min-w-[130px]' },
  { key: 'segurado', label: 'Segurado', minW: 'min-w-[140px]' },
  { key: 'seguradora', label: 'Seguradora', minW: 'min-w-[130px]' },
  { key: 'conducao', label: 'Condu\u00E7\u00E3o', minW: 'min-w-[100px]' },
  { key: 'recebimento', label: 'Recebimento', minW: 'min-w-[100px]' },
  { key: 'aberturaSinistro', label: 'Abertura do Sinistro', minW: 'min-w-[130px]' },
  { key: 'tipoEvento', label: 'Tipo de Evento', minW: 'min-w-[110px]' },
  { key: 'mercadoria', label: 'Mercadoria', minW: 'min-w-[110px]' },
];

type StatusOption = 'Enviado' | 'Pendente' | 'N/A';
const TWO_OPTION_VALUES: StatusOption[] = ['Enviado', 'Pendente'];
const THREE_OPTION_VALUES: StatusOption[] = ['Enviado', 'Pendente', 'N/A'];

interface StatusColumnDef {
  key: EditableField;
  label: string;
  options: StatusOption[];
}

const STATUS_COLUMNS: StatusColumnDef[] = [
  { key: 'preliminar', label: 'Preliminar', options: TWO_OPTION_VALUES },
  { key: 'email', label: 'E-mail', options: TWO_OPTION_VALUES },
  { key: 'custos', label: 'Custos', options: TWO_OPTION_VALUES },
  { key: 'salvados', label: 'Salvados', options: THREE_OPTION_VALUES },
];

// ==========================================
// HELPERS
// ==========================================

function fieldToSnake(field: EditableField): string {
  if (field === 'tipoEvento') return 'tipo_evento';
  if (field === 'finCentral') return 'fin_central';
  if (field === 'cobrancaDocs') return 'cobranca_docs';
  if (field === 'aberturaSinistro') return 'abertura_sinistro';
  return field;
}

function rowToControle(row: Record<string, unknown>): ProcessoControle {
  return {
    id: row.id as string,
    numero: (row.numero as string) || '',
    segurado: (row.segurado as string) || '',
    seguradora: (row.seguradora as string) || '',
    conducao: (row.conducao as string) || '',
    recebimento: (row.recebimento as string) || '',
    aberturaSinistro: (row.abertura_sinistro as string) || '',
    tipoEvento: (row.tipo_evento as string) || '',
    mercadoria: (row.mercadoria as string) || '',
    preliminar: (row.preliminar as string) || '',
    email: (row.email as string) || '',
    custos: (row.custos as string) || '',
    salvados: (row.salvados as string) || '',
    finCentral: (row.fin_central as string) || '',
    cobrancaDocs: (row.cobranca_docs as string) || '',
    decurso: (row.decurso as string) || '',
    origemPdf: (row.origem_pdf as boolean) || false,
  };
}

function controleToRow(p: ProcessoControle) {
  return {
    id: p.id,
    numero: p.numero,
    segurado: p.segurado,
    seguradora: p.seguradora,
    conducao: p.conducao,
    recebimento: p.recebimento,
    abertura_sinistro: p.aberturaSinistro,
    tipo_evento: p.tipoEvento,
    mercadoria: p.mercadoria,
    preliminar: p.preliminar,
    email: p.email,
    custos: p.custos,
    salvados: p.salvados,
    fin_central: p.finCentral,
    cobranca_docs: p.cobrancaDocs,
    decurso: p.decurso,
    origem_pdf: p.origemPdf || false,
    updated_at: new Date().toISOString(),
  };
}

function parseDataBr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (parts) {
    return new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
  }
  const isoDate = new Date(dateStr);
  return isNaN(isoDate.getTime()) ? null : isoDate;
}

function daysBetween(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function statusBadgeClasses(value: string): string {
  const v = value.toLowerCase().trim();
  if (v === 'enviado') return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
  if (v === 'pendente') return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
  if (v === 'n/a') return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700';
  return 'bg-muted text-muted-foreground border-border';
}

// ==========================================
// INLINE EDIT (text fields)
// ==========================================

function InlineEdit({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn('h-7 text-xs px-1.5 min-w-[60px]', className)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'cursor-pointer text-xs px-1 py-0.5 rounded hover:bg-muted/60 transition-colors inline-block min-w-[40px]',
        !value && 'text-muted-foreground',
        className
      )}
      title="Clique para editar"
    >
      {value || '\u2014'}
    </span>
  );
}

// ==========================================
// STATUS SELECTOR (Enviado / Pendente / N/A)
// ==========================================

function StatusSelector({
  value,
  options,
  onChange,
}: {
  value: string;
  options: StatusOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [open]);

  const currentLabel = value || '\u2014';
  const hasValue = options.some(
    (o) => o.toLowerCase() === value.toLowerCase().trim()
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={cn(
          'text-[11px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all select-none whitespace-nowrap',
          hasValue
            ? statusBadgeClasses(value)
            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
        )}
      >
        {currentLabel}
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[110px]"
              style={{ top: pos.top, left: pos.left }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-2',
                    value.toLowerCase() === opt.toLowerCase() && 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      opt === 'Enviado' && 'bg-emerald-500',
                      opt === 'Pendente' && 'bg-red-500',
                      opt === 'N/A' && 'bg-purple-500'
                    )}
                  />
                  {opt}
                </button>
              ))}
              {value && (
                <button
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors border-t border-border mt-1 pt-1.5"
                >
                  Limpar
                </button>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ==========================================
// SKELETON
// ==========================================

function ControleTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 14 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 14 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ControleProcessos() {
  const [, navigate] = useLocation();
  const [processos, setProcessos] = useState<ProcessoControle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [pdfErro, setPdfErro] = useState<string | null>(null);
  const [ultimosImportados, setUltimosImportados] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formNumero, setFormNumero] = useState('');
  const [formSegurado, setFormSegurado] = useState('');
  const [formSeguradora, setFormSeguradora] = useState('');
  const [formConducao, setFormConducao] = useState('');
  const [formRecebimento, setFormRecebimento] = useState('');
  const [formAberturaSinistro, setFormAberturaSinistro] = useState('');
  const [formTipoEvento, setFormTipoEvento] = useState('');
  const [formMercadoria, setFormMercadoria] = useState('');

  useEffect(() => {
    loadProcessos();
  }, []);

  async function loadProcessos() {
    const { data, error } = await supabase
      .from('processos_controle')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProcessos(
        data.map((r) => rowToControle(r as Record<string, unknown>))
      );
    }
    setLoading(false);
  }

  const updateField = useCallback(
    async (id: string, field: EditableField, value: string) => {
      setProcessos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
      await supabase
        .from('processos_controle')
        .update({
          [fieldToSnake(field)]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    },
    []
  );

  // Prazo alerts: Preliminar must be sent within 2 days of aberturaSinistro
  const alertas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const items: { id: string; numero: string; dias: number }[] = [];

    for (const p of processos) {
      if (p.preliminar.toLowerCase() === 'enviado') continue;
      const dtAbertura = parseDataBr(p.aberturaSinistro);
      if (!dtAbertura) continue;
      const prazo = new Date(dtAbertura);
      prazo.setDate(prazo.getDate() + 2);
      const diasRestantes = daysBetween(hoje, prazo);
      if (diasRestantes <= 0) {
        items.push({ id: p.id, numero: p.numero, dias: Math.abs(diasRestantes) });
      }
    }
    return items;
  }, [processos]);

  const handleAddManual = async () => {
    if (!formNumero.trim()) {
      toast.error('Informe o numero do processo');
      return;
    }

    const newItem: ProcessoControle = {
      id: nanoid(),
      numero: formNumero,
      segurado: formSegurado,
      seguradora: formSeguradora,
      conducao: formConducao,
      recebimento: formRecebimento,
      aberturaSinistro: formAberturaSinistro,
      tipoEvento: formTipoEvento,
      mercadoria: formMercadoria,
      preliminar: '',
      email: '',
      custos: '',
      salvados: '',
      finCentral: '',
      cobrancaDocs: '',
      decurso: '',
      origemPdf: false,
    };

    await supabase.from('processos_controle').insert(controleToRow(newItem));
    setProcessos((prev) => [newItem, ...prev]);

    setFormNumero('');
    setFormSegurado('');
    setFormSeguradora('');
    setFormConducao('');
    setFormRecebimento('');
    setFormAberturaSinistro('');
    setFormTipoEvento('');
    setFormMercadoria('');
    setShowAddDialog(false);
    toast.success('Processo adicionado');
  };

  const handleDelete = async (id: string) => {
    setProcessos((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('processos_controle').delete().eq('id', id);
    toast.success('Processo removido');
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessandoPdf(true);
    setPdfErro(null);
    setUltimosImportados([]);

     try {
      const geminiKey = "AIzaSyDCtjKce8C4fvisuHkNGCEwUt0qyaIonyE"; // 
      if (!geminiKey) {
        throw new Error('VITE_GEMINI_API_KEY nao configurada');
      }

      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      const imported: string[] = [];
      const duplicados: string[] = [];
      const newProcessos: ProcessoControle[] = [];
      let processosAtualizados = [...processos];

      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          setPdfErro(`Arquivo "${file.name}" nao e um PDF`);
          setProcessandoPdf(false);
          return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const imageParts: { inlineData: { data: string; mimeType: string } }[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          const base64Image = canvas
            .toDataURL('image/jpeg', 0.8)
            .split(',')[1];
          imageParts.push({
            inlineData: { data: base64Image, mimeType: 'image/jpeg' },
          });
        }

        if (imageParts.length === 0) {
          toast.error(`Nao foi possivel renderizar "${file.name}"`);
          continue;
        }

        const promptFinal = `Voce e um assistente da Wagner Reguladora. Analise estas imagens de um aviso preliminar escaneado. Extraia os dados e retorne EXCLUSIVAMENTE um objeto JSON valido (sem formatacao markdown): { "numero": "numero do processo (ex: 202610.1234.01)", "segurado": "nome do segurado", "seguradora": "nome da seguradora", "conducao": "Apenas o primeiro nome do regulador", "recebimento": "data no formato DD/MM/AAAA", "aberturaSinistro": "data e horario de abertura do sinistro no formato DD/MM/AAAA HH:MM (fica perto da palavra Preliminar no documento)", "tipoEvento": "Atendimento ou Vistoria", "mercadoria": "tipo de mercadoria" }. Valores nao encontrados devem ser "".`;

        const result = await model.generateContent([
          promptFinal,
          ...imageParts,
        ]);

        const textoResposta = result.response.text();
        const jsonLimpo = textoResposta
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();

        let d: Record<string, string>;
        try {
          d = JSON.parse(jsonLimpo);
        } catch {
          toast.error(`Erro ao interpretar resposta para "${file.name}"`);
          continue;
        }

        const numero = d.numero || '';

        if (
          numero &&
          processosAtualizados.some((p) => p.numero === numero)
        ) {
          duplicados.push(numero);
          continue;
        }

        const newItem: ProcessoControle = {
          id: nanoid(),
          numero,
          segurado: d.segurado || '',
          seguradora: d.seguradora || '',
          conducao: d.conducao || '',
          recebimento: d.recebimento || '',
          aberturaSinistro: d.aberturaSinistro || '',
          tipoEvento: d.tipoEvento || '',
          mercadoria: d.mercadoria || '',
          preliminar: '',
          email: '',
          custos: '',
          salvados: '',
          finCentral: '',
          cobrancaDocs: '',
          decurso: '',
          origemPdf: true,
        };

        await supabase.from('processos_controle').insert(controleToRow(newItem));
        newProcessos.push(newItem);
        processosAtualizados = [newItem, ...processosAtualizados];
        imported.push(numero || file.name);
      }

      if (duplicados.length > 0) {
        toast.warning(
          `${duplicados.length} processo(s) duplicado(s) ignorado(s): ${duplicados.join(', ')}`
        );
      }

      if (newProcessos.length > 0) {
        setProcessos((prev) => [...newProcessos, ...prev]);
        setUltimosImportados(imported);
        toast.success(`${newProcessos.length} processo(s) importado(s) via IA`);
      }
    } catch (err) {
      setPdfErro(String(err instanceof Error ? err.message : err));
    } finally {
      setProcessandoPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Check if a row has preliminar alert
  const preliminarAtrasada = useCallback(
    (p: ProcessoControle): boolean => {
      if (p.preliminar.toLowerCase() === 'enviado') return false;
      const dtAbertura = parseDataBr(p.aberturaSinistro);
      if (!dtAbertura) return false;
      const prazo = new Date(dtAbertura);
      prazo.setDate(prazo.getDate() + 2);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return hoje >= prazo;
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Controle de Processos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {processos.length} processo(s) cadastrado(s) -- clique em qualquer
            celula para editar
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddDialog(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={processandoPdf}
          >
            {processandoPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4" />
            )}
            Importar PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handlePdfUpload}
          />
        </div>
      </div>

      {/* Alertas de Prazo da Preliminar */}
      {alertas.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="py-3 px-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                Preliminar Atrasada -- {alertas.length} processo(s)
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                A preliminar deve ser enviada em no maximo 2 dias apos a abertura do sinistro.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {alertas.map((a) => (
                  <Badge
                    key={a.id}
                    variant="outline"
                    className="border-red-300 text-red-700 dark:text-red-300 text-[10px]"
                  >
                    {a.numero || 'Sem numero'} ({a.dias}d atrasado)
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status banners */}
      {processandoPdf && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-300 text-sm">
                Processando PDF com Inteligencia Artificial...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Os dados serao extraidos automaticamente
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {pdfErro && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-300 text-sm">
                Erro na importacao
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                {pdfErro}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPdfErro(null)}
              className="text-red-600"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}

      {ultimosImportados.length > 0 && !processandoPdf && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900 dark:text-emerald-300 text-sm">
                {ultimosImportados.length} processo(s) importado(s) com sucesso
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                {ultimosImportados.join(', ')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUltimosImportados([])}
              className="text-emerald-600"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <ControleTableSkeleton />
      ) : processos.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Nenhum processo cadastrado
            </p>
            <p className="text-xs text-muted-foreground">
              Adicione manualmente ou importe um PDF
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {INLINE_EDIT_COLUMNS.map((col) => (
                      <TableHead
                        key={col.key}
                        className={cn(
                          col.minW,
                          col.key === 'numero' && 'sticky left-0 bg-card z-10'
                        )}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    {STATUS_COLUMNS.map((col) => (
                      <TableHead key={col.key} className="min-w-[90px]">
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[100px] text-center">
                      Fin. Central
                    </TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map((p) => {
                    const hasAlert = preliminarAtrasada(p);
                    return (
                      <TableRow
                        key={p.id}
                        className={cn(
                          'group hover:bg-muted/30',
                          hasAlert && 'bg-red-50/50 dark:bg-red-950/10'
                        )}
                      >
                        {/* Inline-editable text columns */}
                        {INLINE_EDIT_COLUMNS.map((col) => (
                          <TableCell
                            key={col.key}
                            className={cn(
                              col.key === 'numero' &&
                                'sticky left-0 bg-card z-10 group-hover:bg-muted/30'
                            )}
                          >
                            {col.key === 'numero' ? (
                              <div className="flex items-center gap-1.5">
                                {p.origemPdf && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Importado via IA
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <InlineEdit
                                  value={p.numero}
                                  onChange={(v) => updateField(p.id, 'numero', v)}
                                  className="font-mono font-medium text-primary"
                                />
                                {hasAlert && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Preliminar atrasada!
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <InlineEdit
                                value={p[col.key]}
                                onChange={(v) => updateField(p.id, col.key, v)}
                              />
                            )}
                          </TableCell>
                        ))}

                        {/* Status columns with dropdowns */}
                        {STATUS_COLUMNS.map((col) => (
                          <TableCell key={col.key}>
                            <StatusSelector
                              value={p[col.key]}
                              options={col.options}
                              onChange={(v) => updateField(p.id, col.key, v)}
                            />
                          </TableCell>
                        ))}

                        {/* Fin. Central -- Button that navigates */}
                        <TableCell className="text-center">
                          <Button
                            variant={
                              p.finCentral.toLowerCase() === 'ok'
                                ? 'secondary'
                                : 'outline'
                            }
                            size="sm"
                            className={cn(
                              'gap-1.5 text-xs h-7',
                              p.finCentral.toLowerCase() === 'ok'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'border-primary/40 text-primary hover:bg-primary/10'
                            )}
                            onClick={() => navigate(`/finalizar/${p.id}`)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {p.finCentral.toLowerCase() === 'ok'
                              ? 'Finalizado'
                              : 'Finalizar'}
                          </Button>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDelete(p.id)}
                                className="gap-2 text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Manual Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Adicionar Processo
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numero do Processo *</Label>
              <Input
                placeholder="Ex: 2025.001234"
                value={formNumero}
                onChange={(e) => setFormNumero(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Segurado</Label>
              <Input
                placeholder="Nome do segurado"
                value={formSegurado}
                onChange={(e) => setFormSegurado(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Seguradora</Label>
              <Input
                placeholder="Nome da seguradora"
                value={formSeguradora}
                onChange={(e) => setFormSeguradora(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Conducao</Label>
              <Input
                placeholder="Primeiro nome do regulador"
                value={formConducao}
                onChange={(e) => setFormConducao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Recebimento</Label>
              <Input
                placeholder="DD/MM/AAAA"
                value={formRecebimento}
                onChange={(e) => setFormRecebimento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Abertura do Sinistro</Label>
              <Input
                placeholder="DD/MM/AAAA HH:MM"
                value={formAberturaSinistro}
                onChange={(e) => setFormAberturaSinistro(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Input
                placeholder="Atendimento ou Vistoria"
                value={formTipoEvento}
                onChange={(e) => setFormTipoEvento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mercadoria</Label>
              <Input
                placeholder="Descricao da mercadoria"
                value={formMercadoria}
                onChange={(e) => setFormMercadoria(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddManual} className="gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
