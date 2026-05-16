import { useParams, useLocation } from 'wouter';
import { useState } from 'react';
import { toast } from 'sonner';
import { useProcessos } from '@/contexts/SinistrosContext';
import { generateProcessoReport } from '@/lib/generateReport';
import { getStatusColor, isProcessoParado } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileText, Search, ClipboardCheck, Calculator, Flag, Phone, CircleCheck as CheckCircle2, Circle as XCircle, CircleMinus as MinusCircle, FileDown, Copy, CircleAlert as AlertCircle, Clock } from 'lucide-react';

function DetalhesProcessoSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Timeline skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="w-3 h-3 rounded-full" />
                {i < 2 && <Skeleton className="w-0.5 h-12 mt-1" />}
              </div>
              <div className="flex-1 space-y-2 pb-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-60" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string | number | boolean | undefined; highlight?: boolean }) {
  const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : (value || '—');
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[60%] ${highlight ? 'text-primary' : 'text-foreground'}`}>{String(display)}</span>
    </div>
  );
}

function BoolIcon({ value }: { value: boolean }) {
  return value ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-500" />;
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <BoolIcon value={checked} />
      <span className={`text-sm ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

export default function DetalhesProcesso() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { getProcesso, duplicarProcesso, loading } = useProcessos();
  const [showDuplicarDialog, setShowDuplicarDialog] = useState(false);
  const [novoNumero, setNovoNumero] = useState('');

  const processo = getProcesso(id!);

  if (loading) {
    return <DetalhesProcessoSkeleton />;
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Processo não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/processos')} className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
    );
  }

  const parado = isProcessoParado(processo);
  const memoriaCalculo = processo.totalEmbarcado - processo.totalRecebido - processo.totalRecusado - processo.salvadosValor + processo.dispersaoSaque;

  const handleExportarPDF = () => {
    generateProcessoReport(processo);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  const handleDuplicar = async () => {
    if (!novoNumero.trim()) {
      toast.error('Digite o novo número do processo');
      return;
    }
    const duplicado = await duplicarProcesso(id!, novoNumero);
    if (duplicado) {
      toast.success(`Processo ${novoNumero} criado a partir da duplicação`);
      setShowDuplicarDialog(false);
      setNovoNumero('');
      navigate(`/processo/${duplicado.id}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/processos')} className="mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground font-mono">{processo.numero}</h1>
              <Badge className={getStatusColor(processo.status)}>{processo.status}</Badge>
              {parado && <Badge variant="destructive" className="gap-1.5"><AlertCircle className="w-3 h-3" /> Parado</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Operador: <strong>{processo.operador}</strong> • Abertura: {new Date(processo.dataAbertura).toLocaleDateString('pt-BR')}
              {processo.segurado && <> • Segurado: <strong>{processo.segurado}</strong></>}
              {processo.seguradora && <> • Seguradora: <strong>{processo.seguradora}</strong></>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportarPDF} className="gap-1.5" variant="default">
            <FileDown className="w-4 h-4" /> PDF
          </Button>
          <Button onClick={() => setShowDuplicarDialog(true)} className="gap-1.5" variant="outline">
            <Copy className="w-4 h-4" /> Duplicar
          </Button>
        </div>
      </div>

      {parado && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">Processo parado há mais de 3 dias</p>
              <p className="text-sm text-red-800 dark:text-red-400 mt-1">Última movimentação em {processo.dataAbertura}. Considere atualizar o status.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="abertura" className="w-full">
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="abertura" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" /> Abertura</TabsTrigger>
          <TabsTrigger value="vistoria" className="text-xs gap-1"><Search className="w-3.5 h-3.5" /> Vistoria</TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> Checklist</TabsTrigger>
          <TabsTrigger value="prejuizo" className="text-xs gap-1"><Calculator className="w-3.5 h-3.5" /> Prejuízo</TabsTrigger>
          <TabsTrigger value="finalizar" className="text-xs gap-1"><Flag className="w-3.5 h-3.5" /> Finalizar</TabsTrigger>
          <TabsTrigger value="acionamento" className="text-xs gap-1"><Phone className="w-3.5 h-3.5" /> Acionamento</TabsTrigger>
        </TabsList>

        <TabsContent value="abertura">
          <Card>
            <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Número do processo" value={processo.numero} highlight />
              <InfoRow label="Segurado" value={processo.segurado} />
              <InfoRow label="Seguradora" value={processo.seguradora} />
              <InfoRow label="Operador" value={processo.operador} />
              <InfoRow label="Data de abertura" value={new Date(processo.dataAbertura).toLocaleDateString('pt-BR')} />
              <InfoRow label="Status" value={processo.status} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vistoria">
          <Card>
            <CardHeader><CardTitle className="text-base">Vistoria</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Data encerramento vistoriador" value={processo.dataEncerramentoVistoriador ? new Date(processo.dataEncerramentoVistoriador).toLocaleDateString('pt-BR') : ''} />
              <InfoRow label="Data encerramento Finalizar Central" value={processo.dataEncerramentoFinalizarCentral ? new Date(processo.dataEncerramentoFinalizarCentral).toLocaleDateString('pt-BR') : ''} />
              {processo.justificativaAtraso && <InfoRow label="Justificativa atraso" value={processo.justificativaAtraso} />}
              <Separator />
              <p className="text-sm font-semibold text-foreground">Atendimento de Vistoria</p>
              {processo.atendimentoVistoria.length > 0 ? (
                processo.atendimentoVistoria.map(item => <ChecklistItem key={item} label={item} checked={true} />)
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum item marcado</p>
              )}
              <Separator />
              <InfoRow label="Tacógrafo coletado" value={processo.tacografoColetado === 'sim' ? 'Sim' : processo.tacografoColetado === 'nao' ? 'Não' : 'Não necessário'} />
              {processo.tacografoColetado === 'nao' && <InfoRow label="Motivo" value={processo.motivoTacografoNaoColetado} />}
              <InfoRow label="Velocidade registrada" value={processo.velocidadeRegistrada} />
              <InfoRow label="Velocidade permitida" value={processo.velocidadePermitida} />
              <InfoRow label="Disco vencido" value={processo.discoVencido} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader><CardTitle className="text-base">Checklist Operacional</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ChecklistItem label="Documentos / Fotos Recebidos" checked={processo.documentosFotosRecebidos} />
              <ChecklistItem label="Custos aprovados no histórico" checked={processo.custosAprovados} />
              <InfoRow label="Histórico" value={processo.historicoStatus} />
              <InfoRow label="Salvados lançados" value={processo.salvadosLancados} />
              <ChecklistItem label="Vistoriador encerrado no sistema" checked={processo.vistoriadorEncerrado} />
              <ChecklistItem label="Não conformidade" checked={processo.naoConformidade} />
              {processo.naoConformidade && <InfoRow label="Descrição" value={processo.naoConformidadeDescricao} />}
              {processo.checklistEspecial.length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm font-semibold text-foreground">Checklist Especial</p>
                  {processo.checklistEspecial.map(item => <ChecklistItem key={item} label={item} checked={true} />)}
                </>
              )}
              <Separator />
              <ChecklistItem label="Tratativas e-mail encerradas" checked={processo.tratativasEmailEncerradas} />
              <ChecklistItem label="Inventário de salvados" checked={processo.inventarioSalvados} />
              <ChecklistItem label="Documentos assinados" checked={processo.documentosAssinados} />
              {!processo.documentosAssinados && <InfoRow label="Justificativa" value={processo.documentosAssinadosJustificativa} />}
              <ChecklistItem label="Mercadorias sem info na preliminar" checked={processo.mercadoriasSemInfo} />
              <ChecklistItem label="Limpeza de pista sem tratativas" checked={processo.limpezaPistaSemTratativas} />
              <ChecklistItem label="Perícia sindicante" checked={processo.periciaSindicante} />
              <ChecklistItem label="Acionamento sindicância" checked={processo.acionamentoSindicancia} />
              <ChecklistItem label="Alteração de reserva" checked={processo.alteracaoReserva} />
              <Separator />
              <p className="text-sm font-semibold text-foreground">Custos</p>
              <ChecklistItem label="Custos lançados" checked={processo.custosLancados} />
              <InfoRow label="Custos ultrapassaram autonomia" value={processo.custosUltrapassaramAutonomia || 'N/A'} />
              {processo.custosUltrapassaramAutonomia === 'sim' && <ChecklistItem label="Seguradora notificada" checked={processo.seguradoraNotificada} />}
              <ChecklistItem label="Informações complementares lançadas" checked={processo.informacoesComplementaresLancadas} />
              <Separator />
              <p className="text-sm font-semibold text-foreground">Vistoria Lona / Veículo</p>
              <ChecklistItem label="Lona e veículo inspecionados" checked={processo.lonaVeiculoInspecionados} />
              <ChecklistItem label="Furos na lona" checked={processo.furosNaLona} />
              <ChecklistItem label="Todas as lonas inspecionadas" checked={processo.todasLonasInspecionadas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prejuizo">
          <Card>
            <CardHeader><CardTitle className="text-base">Prejuízo / Memória de Cálculo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Prejuízo apurado" value={processo.prejuizoApurado} />
              {!processo.prejuizoApurado && <InfoRow label="Motivo" value={processo.motivoPrejuizoNaoApurado} />}
              {processo.prejuizoApurado && (
                <>
                  <Separator />
                  <InfoRow label="Total embarcado" value={`R$ ${processo.totalEmbarcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <InfoRow label="Total recebido" value={`R$ ${processo.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <InfoRow label="Total recusado" value={`R$ ${processo.totalRecusado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <InfoRow label="Salvados" value={`R$ ${processo.salvadosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <InfoRow label="Dispersão/Saque" value={`R$ ${processo.dispersaoSaque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <Separator />
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground">Memória de Cálculo</p>
                    <p className="text-xl font-bold text-primary mt-1">R$ {memoriaCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finalizar">
          <Card>
            <CardHeader><CardTitle className="text-base">Finalizar Central</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Modelo" value={processo.modeloFinalizarCentral} />
              <InfoRow label="Causa do evento" value={processo.causaEvento} highlight />
              <InfoRow label="Relato do motorista" value={processo.relatoMotorista} />
              <InfoRow label="Resumo do atendimento" value={processo.resumoAtendimento} />
              <InfoRow label="Local do evento" value={processo.localEvento} />
              <InfoRow label="Disco tacógrafo" value={processo.discoTacografo} />
              <InfoRow label="Parecer velocidade/causa" value={processo.parecerVelocidade} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acionamento">
          <Card>
            <CardHeader><CardTitle className="text-base">Acionamento / Atendimento / Providências</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Acionamento/comunicado" value={processo.acionamentoComunicado} />
              <InfoRow label="Realizado por" value={processo.realizadoPor} />
              <InfoRow label="Horário" value={processo.horarioAcionamento} />
              <InfoRow label="Atendimento in loco" value={processo.atendimentoInLoco} />
              <Separator />
              <InfoRow label="Situação do veículo" value={processo.situacaoVeiculo} />
              <InfoRow label="Condições da mercadoria" value={processo.condicoesMercadoria} />
              <InfoRow label="Destinação da mercadoria" value={processo.destinacaoMercadoria} />
              <InfoRow label="Descrição do atendimento" value={processo.descricaoAtendimento} />
              {processo.observacaoAtendimento && <InfoRow label="Observação" value={processo.observacaoAtendimento} />}
              {processo.documentosPendentes.length > 0 && (
                <>
                  <Separator />
                  <p className="text-sm font-semibold text-foreground">Documentos Pendentes</p>
                  {processo.documentosPendentes.map(doc => (
                    <div key={doc} className="flex items-center gap-2 py-1">
                      <MinusCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-sm text-foreground">{doc}</span>
                    </div>
                  ))}
                </>
              )}
              <Separator />
              <InfoRow label="Vistoria final" value={processo.vistoriaFinal} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Histórico do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processo.historico.map((entry, idx) => (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                  {idx < processo.historico.length - 1 && <div className="w-0.5 h-12 bg-border my-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{entry.acao}</p>
                      <p className="text-sm text-muted-foreground">{entry.detalhes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{entry.data}</p>
                      <p className="text-xs text-muted-foreground">{entry.hora}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Por: {entry.operador}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Duplicação */}
      <Dialog open={showDuplicarDialog} onOpenChange={setShowDuplicarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" /> Duplicar Processo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Digite o novo número do processo. Todos os dados serão copiados do processo atual.
            </p>
            <div className="space-y-2">
              <Label>Novo Número do Processo</Label>
              <Input
                placeholder="Ex: PROC-2025-013"
                value={novoNumero}
                onChange={e => setNovoNumero(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicar} className="gap-1.5">
              <Copy className="w-4 h-4" /> Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
