import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';
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
import { Plus, FileUp, Loader as Loader2, FileText, Sparkles, Trash2, MoveVertical as MoreVertical, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const STATUS_COLUMNS: { key: EditableField; label: string; short: string }[] = [
  { key: 'preliminar', label: 'Preliminar', short: 'Prel.' },
  { key: 'email', label: 'E-mail', short: 'Email' },
  { key: 'custos', label: 'Custos', short: 'Cust.' },
  { key: 'salvados', label: 'Salvados', short: 'Salv.' },
  { key: 'finCentral', label: 'Fin. Central', short: 'F.Cen.' },
  { key: 'cobrancaDocs', label: 'Cobr. Docs', short: 'C.Doc' },
  { key: 'decurso', label: 'Decurso', short: 'Dec.' },
];

const INFO_COLUMNS: { key: EditableField; label: string }[] = [
  { key: 'numero', label: 'Numero' },
  { key: 'segurado', label: 'Segurado' },
  { key: 'seguradora', label: 'Seguradora' },
  { key: 'conducao', label: 'Conducao' },
  { key: 'recebimento', label: 'Recebimento' },
  { key: 'tipoEvento', label: 'Tipo Evento' },
  { key: 'mercadoria', label: 'Mercadoria' },
];

function rowToControle(row: Record<string, unknown>): ProcessoControle {
  return {
    id: row.id as string,
    numero: (row.numero as string) || '',
    segurado: (row.segurado as string) || '',
    seguradora: (row.seguradora as string) || '',
    conducao: (row.conducao as string) || '',
    recebimento: (row.recebimento as string) || '',
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

function InlineEdit({
  value,
  onChange,
  className,
  isStatus,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  isStatus?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
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
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={cn('h-7 text-xs px-1.5 min-w-[60px]', isStatus && 'w-[72px]', className)}
      />
    );
  }

  const display = value || '\u2014';
  const statusColor = isStatus
    ? value.toLowerCase() === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
      : value.toLowerCase() === 'pendente'
        ? 'text-amber-600 dark:text-amber-400'
        : ''
    : '';

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      className={cn(
        'cursor-pointer text-xs px-1 py-0.5 rounded hover:bg-muted/60 transition-colors inline-block min-w-[40px]',
        !value && 'text-muted-foreground',
        statusColor,
        className
      )}
      title="Duplo clique para editar"
    >
      {display}
    </span>
  );
}

function ControleTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-4 w-16" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
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

export default function ControleProcessos() {
  const [processos, setProcessos] = useState<ProcessoControle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [pdfErro, setPdfErro] = useState<string | null>(null);
  const [ultimosImportados, setUltimosImportados] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for manual add
  const [formNumero, setFormNumero] = useState('');
  const [formSegurado, setFormSegurado] = useState('');
  const [formSeguradora, setFormSeguradora] = useState('');
  const [formConducao, setFormConducao] = useState('');
  const [formRecebimento, setFormRecebimento] = useState('');
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
      setProcessos(data.map(r => rowToControle(r as Record<string, unknown>)));
    }
    setLoading(false);
  }

  const updateField = useCallback(async (id: string, field: EditableField, value: string) => {
    setProcessos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

    const snakeField = field === 'tipoEvento' ? 'tipo_evento'
      : field === 'finCentral' ? 'fin_central'
      : field === 'cobrancaDocs' ? 'cobranca_docs'
      : field === 'origemPdf' ? 'origem_pdf'
      : field;

    await supabase
      .from('processos_controle')
      .update({ [snakeField]: value, updated_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

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
    setProcessos(prev => [newItem, ...prev]);

    setFormNumero('');
    setFormSegurado('');
    setFormSeguradora('');
    setFormConducao('');
    setFormRecebimento('');
    setFormTipoEvento('');
    setFormMercadoria('');
    setShowAddDialog(false);
    toast.success('Processo adicionado');
  };

  const handleDelete = async (id: string) => {
    setProcessos(prev => prev.filter(p => p.id !== id));
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
      const filePayloads: { base64: string; name: string }[] = [];

      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          setPdfErro(`Arquivo "${file.name}" nao e um PDF`);
          setProcessandoPdf(false);
          return;
        }

        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        filePayloads.push({ base64, name: file.name });
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: filePayloads }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errText}`);
      }

      const { results, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      const imported: string[] = [];
      const duplicados: string[] = [];
      const newProcessos: ProcessoControle[] = [];
      let processosAtualizados = [...processos];

      for (const result of results) {
        if (result.error || !result.data) {
          toast.error(`Erro em "${result.name}": ${result.error}`);
          continue;
        }

        const d = result.data;
        const numero = d.numero || '';

        if (numero && processosAtualizados.some(p => p.numero === numero)) {
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
        imported.push(numero || result.name);
      }

      if (duplicados.length > 0) {
        toast.warning(`${duplicados.length} processo(s) duplicado(s) ignorado(s): ${duplicados.join(', ')}`);
      }

      if (newProcessos.length > 0) {
        setProcessos(prev => [...newProcessos, ...prev]);
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
            {processos.length} processo(s) cadastrado(s)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddDialog(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Adicionar Processo
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
            Importar PDF (Aviso Preliminar)
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

      {/* Status banners */}
      {processandoPdf && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-300 text-sm">Processando PDF com Inteligencia Artificial...</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Os dados serao extraidos automaticamente</p>
            </div>
          </CardContent>
        </Card>
      )}

      {pdfErro && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-300 text-sm">Erro na importacao</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{pdfErro}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPdfErro(null)} className="text-red-600">
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
            <Button variant="ghost" size="sm" onClick={() => setUltimosImportados([])} className="text-emerald-600">
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
            <p className="text-muted-foreground text-sm">Nenhum processo cadastrado</p>
            <p className="text-xs text-muted-foreground">Adicione manualmente ou importe um PDF</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px] sticky left-0 bg-card z-10">Numero</TableHead>
                    <TableHead className="min-w-[120px]">Segurado</TableHead>
                    <TableHead className="min-w-[120px]">Seguradora</TableHead>
                    <TableHead className="min-w-[80px]">Conducao</TableHead>
                    <TableHead className="min-w-[90px]">Recebimento</TableHead>
                    <TableHead className="min-w-[80px]">Tipo</TableHead>
                    <TableHead className="min-w-[100px]">Mercadoria</TableHead>
                    {STATUS_COLUMNS.map(col => (
                      <TableHead key={col.key} className="min-w-[72px] text-center">
                        <span className="hidden lg:inline">{col.label}</span>
                        <span className="lg:hidden">{col.short}</span>
                      </TableHead>
                    ))}
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map(p => (
                    <TableRow key={p.id} className="group hover:bg-muted/30">
                      <TableCell className="sticky left-0 bg-card z-10 group-hover:bg-muted/30">
                        <div className="flex items-center gap-1.5">
                          {p.origemPdf && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>Importado via IA</TooltipContent>
                            </Tooltip>
                          )}
                          <InlineEdit
                            value={p.numero}
                            onChange={v => updateField(p.id, 'numero', v)}
                            className="font-mono font-medium text-primary"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={p.segurado} onChange={v => updateField(p.id, 'segurado', v)} />
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={p.seguradora} onChange={v => updateField(p.id, 'seguradora', v)} />
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={p.conducao} onChange={v => updateField(p.id, 'conducao', v)} />
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={p.recebimento} onChange={v => updateField(p.id, 'recebimento', v)} />
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={p.tipoEvento} onChange={v => updateField(p.id, 'tipoEvento', v)} />
                      </TableCell>
                      <TableCell>
                        <InlineEdit value={p.mercadoria} onChange={v => updateField(p.id, 'mercadoria', v)} />
                      </TableCell>
                      {STATUS_COLUMNS.map(col => (
                        <TableCell key={col.key} className="text-center">
                          <InlineEdit
                            value={p[col.key]}
                            onChange={v => updateField(p.id, col.key, v)}
                            isStatus
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  ))}
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
                onChange={e => setFormNumero(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Segurado</Label>
              <Input
                placeholder="Nome do segurado"
                value={formSegurado}
                onChange={e => setFormSegurado(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Seguradora</Label>
              <Input
                placeholder="Nome da seguradora"
                value={formSeguradora}
                onChange={e => setFormSeguradora(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Conducao</Label>
              <Input
                placeholder="Primeiro nome do regulador"
                value={formConducao}
                onChange={e => setFormConducao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Recebimento</Label>
              <Input
                placeholder="DD/MM/AAAA"
                value={formRecebimento}
                onChange={e => setFormRecebimento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Input
                placeholder="Atendimento ou Vistoria"
                value={formTipoEvento}
                onChange={e => setFormTipoEvento(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Mercadoria</Label>
              <Input
                placeholder="Descricao da mercadoria"
                value={formMercadoria}
                onChange={e => setFormMercadoria(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
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
