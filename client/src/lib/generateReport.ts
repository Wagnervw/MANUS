// ============================================================
// Wagner Reguladora - Gerador de Relatório PDF
// Gera documento completo do processo com assinatura digital
// ============================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Processo } from './data';

const BLUE = '#1e40af';
const DARK = '#1e293b';
const GRAY = '#64748b';
const LIGHT_BLUE = '#eff6ff';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function boolText(val: boolean): string {
  return val ? 'Sim' : 'Não';
}

export function generateProcessoReport(processo: Processo, assinatura?: string): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // ---- HEADER ----
  doc.setFillColor(30, 64, 175); // #1e40af
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('WAGNER REGULADORA', margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Finalização Central — Relatório de Processo', margin, 22);

  doc.setFontSize(9);
  doc.text(`Processo: ${processo.numero}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`Data: ${formatDate(processo.dataAbertura)}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Operador: ${processo.operador}`, pageWidth - margin, 24, { align: 'right' });
  doc.text(`Status: ${processo.status}`, pageWidth - margin, 30, { align: 'right' });

  y = 42;

  // ---- SECTION HELPER ----
  function sectionTitle(title: string) {
    if (y > 260) { doc.addPage(); y = margin; }
    doc.setFillColor(239, 246, 255); // light blue
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, y + 5.5);
    y += 12;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  }

  function addRow(label: string, value: string) {
    if (y > 275) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label + ':', margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const labelWidth = doc.getTextWidth(label + ': ') + 2;
    doc.text(value || '—', margin + 2 + labelWidth, y);
    y += 5.5;
  }

  function addList(label: string, items: string[]) {
    if (y > 275) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label + ':', margin + 2, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    if (items.length === 0) {
      doc.text('  Nenhum item', margin + 4, y);
      y += 5;
    } else {
      items.forEach(item => {
        if (y > 275) { doc.addPage(); y = margin; }
        doc.text(`  • ${item}`, margin + 4, y);
        y += 4.5;
      });
    }
    y += 1;
  }

  // ---- ABA 1: ABERTURA ----
  sectionTitle('1. ABERTURA');
  addRow('Número do Processo', processo.numero);
  addRow('Operador Responsável', processo.operador);
  addRow('Data de Abertura', formatDate(processo.dataAbertura));
  addRow('Status', processo.status);
  y += 3;

  // ---- ABA 2: VISTORIA ----
  sectionTitle('2. VISTORIA');
  addRow('Data Encerramento Vistoriador', formatDate(processo.dataEncerramentoVistoriador));
  addRow('Data Encerramento Finalizar Central', formatDate(processo.dataEncerramentoFinalizarCentral));
  if (processo.justificativaAtraso) {
    addRow('Justificativa de Atraso', processo.justificativaAtraso);
  }
  addList('Atendimento Vistoria', processo.atendimentoVistoria);
  const tacografoLabel = processo.tacografoColetado === 'sim' ? 'Sim' : processo.tacografoColetado === 'nao' ? 'Não' : 'Não necessário';
  addRow('Tacógrafo Coletado', tacografoLabel);
  if (processo.tacografoColetado === 'nao' && processo.motivoTacografoNaoColetado) {
    addRow('Motivo', processo.motivoTacografoNaoColetado);
  }
  addRow('Velocidade Registrada', processo.velocidadeRegistrada);
  addRow('Velocidade Permitida', processo.velocidadePermitida);
  addRow('Disco Vencido', boolText(processo.discoVencido));
  y += 3;

  // ---- ABA 3: CHECKLIST ----
  sectionTitle('3. CHECKLIST OPERACIONAL');
  addRow('Documentos/Fotos Analisados', boolText(processo.documentosFotosAnalisados));
  addRow('Custos Aprovados no Histórico', boolText(processo.custosAprovados));
  addRow('Histórico do Processo', processo.historicoStatus);
  addRow('Salvados Lançados', processo.salvadosLancados);
  addRow('Vistoriador Encerrado no Sistema', boolText(processo.vistoriadorEncerrado));
  addRow('Ata de Vistoria Conferida', boolText(processo.ataVistoriaConferida));
  addRow('Não Conformidade', boolText(processo.naoConformidade));
  if (processo.naoConformidade && processo.naoConformidadeDescricao) {
    addRow('Descrição NC', processo.naoConformidadeDescricao);
  }
  addList('Checklist Especial', processo.checklistEspecial);
  addRow('Planilha de Prejuízo Conferida', boolText(processo.planilhaPrejuizoConferida));
  if (!processo.planilhaPrejuizoConferida && processo.planilhaPrejuizoJustificativa) {
    addRow('Justificativa', processo.planilhaPrejuizoJustificativa);
  }
  addRow('Mercadorias/Equip. sem Info', boolText(processo.mercadoriasSemInfo));
  addRow('Limpeza de Pista sem Tratativas', boolText(processo.limpezaPistaSemTratativas));
  addRow('Perícia Sindicante', boolText(processo.periciaSindicante));
  addRow('Alteração de Reserva', boolText(processo.alteracaoReserva));
  const lonaLabel = processo.vistoriaLonaAssoalho === 'sim' ? 'Sim' : processo.vistoriaLonaAssoalho === 'nao' ? 'Não' : 'N/A';
  addRow('Vistoria Lona/Assoalho', lonaLabel);
  y += 3;

  // ---- ABA 4: PREJUÍZO ----
  sectionTitle('4. PREJUÍZO / MEMÓRIA DE CÁLCULO');
  addRow('Prejuízo Apurado', boolText(processo.prejuizoApurado));
  if (!processo.prejuizoApurado && processo.motivoPrejuizoNaoApurado) {
    addRow('Motivo', processo.motivoPrejuizoNaoApurado);
  }
  if (processo.prejuizoApurado) {
    y += 2;
    // Table with financial values
    autoTable(doc, {
      startY: y,
      margin: { left: margin + 2, right: margin + 2 },
      head: [['Item', 'Valor (R$)']],
      body: [
        ['Total Embarcado', formatCurrency(processo.totalEmbarcado)],
        ['Total Recebido', formatCurrency(processo.totalRecebido)],
        ['Total Recusado', formatCurrency(processo.totalRecusado)],
        ['Salvados', formatCurrency(processo.salvadosValor)],
        ['Falta / Saque', formatCurrency(processo.faltaSaque)],
      ],
      foot: [['MEMÓRIA DE CÁLCULO', formatCurrency(
        processo.totalEmbarcado - processo.totalRecebido - processo.totalRecusado - processo.salvadosValor + processo.faltaSaque
      )]],
      headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
      footStyles: { fillColor: [239, 246, 255], textColor: [30, 64, 175], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }
  y += 3;

  // ---- ABA 5: FINALIZAR CENTRAL ----
  sectionTitle('5. FINALIZAR CENTRAL');
  addRow('Modelo', processo.modeloFinalizarCentral);
  addRow('Causa do Evento', processo.causaEvento);
  addRow('Declaração do Motorista', processo.declaracaoMotorista);
  addRow('BO do Acidente', processo.boAcidente);
  addRow('Local do Evento', processo.localEvento);
  addRow('Disco Tacógrafo', processo.discoTacografo);
  addRow('Parecer Velocidade', processo.parecerVelocidade);
  y += 3;

  // ---- ABA 6: ACIONAMENTO ----
  sectionTitle('6. ACIONAMENTO / ATENDIMENTO / PROVIDÊNCIAS');
  addRow('Acionamento/Comunicado', processo.acionamentoComunicado);
  addRow('Realizado Por', processo.realizadoPor);
  addRow('Horário', processo.horarioAcionamento);
  addRow('Atendimento In Loco', boolText(processo.atendimentoInLoco));
  addRow('Situação do Veículo', processo.situacaoVeiculo);
  addRow('Condições da Mercadoria', processo.condicoesMercadoria);
  addRow('Destinação da Mercadoria', processo.destinacaoMercadoria);
  addRow('Descrição do Atendimento', processo.descricaoAtendimento);
  if (processo.observacaoAtendimento) {
    addRow('Observação', processo.observacaoAtendimento);
  }
  addList('Documentos Pendentes', processo.documentosPendentes);
  addRow('Vistoria Final', processo.vistoriaFinal);
  y += 6;

  // ---- ASSINATURA DIGITAL ----
  if (y > 240) { doc.addPage(); y = margin; }

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  sectionTitle('ASSINATURA DIGITAL');

  const dataHora = new Date().toLocaleString('pt-BR');
  addRow('Operador Responsável', processo.operador);
  addRow('Data/Hora da Emissão', dataHora);
  addRow('Código de Verificação', generateVerificationCode(processo));

  if (assinatura) {
    y += 3;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(12);
    doc.text(assinatura, pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y);
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do Operador', pageWidth / 2, y, { align: 'center' });
  }

  // ---- FOOTER ----
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Wagner Reguladora — Finalização Central | Página ${i} de ${totalPages} | Gerado em ${dataHora}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`Relatorio_${processo.numero}_${processo.dataAbertura}.pdf`);
}

function generateVerificationCode(processo: Processo): string {
  // Simple hash-like code for verification
  const base = `${processo.numero}-${processo.operador}-${processo.dataAbertura}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `WR-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}-${new Date().getFullYear()}`;
}
