import type { Processo } from './data';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '\u2014';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function boolText(val: boolean): string {
  return val ? 'Sim' : 'N\u00e3o';
}

function generateVerificationCode(processo: Processo): string {
  const base = `${processo.numero}-${processo.operador}-${processo.dataAbertura}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `WR-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}-${new Date().getFullYear()}`;
}

export async function generateProcessoReport(processo: Processo, assinatura?: string): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('WAGNER REGULADORA', margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Finaliza\u00e7\u00e3o Central \u2014 Relat\u00f3rio de Processo', margin, 22);

  doc.setFontSize(9);
  doc.text(`Processo: ${processo.numero}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`Data: ${formatDate(processo.dataAbertura)}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Operador: ${processo.operador}`, pageWidth - margin, 24, { align: 'right' });
  doc.text(`Status: ${processo.status}`, pageWidth - margin, 30, { align: 'right' });

  y = 42;

  function sectionTitle(title: string) {
    if (y > 260) { doc.addPage(); y = margin; }
    doc.setFillColor(239, 246, 255);
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
    doc.text(value || '\u2014', margin + 2 + labelWidth, y);
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
        doc.text(`  \u2022 ${item}`, margin + 4, y);
        y += 4.5;
      });
    }
    y += 1;
  }

  sectionTitle('1. ABERTURA');
  addRow('N\u00famero do Processo', processo.numero);
  addRow('Operador Respons\u00e1vel', processo.operador);
  addRow('Data de Abertura', formatDate(processo.dataAbertura));
  addRow('Status', processo.status);
  y += 3;

  sectionTitle('2. VISTORIA');
  addRow('Data Encerramento Vistoriador', formatDate(processo.dataEncerramentoVistoriador));
  addRow('Data Encerramento Finalizar Central', formatDate(processo.dataEncerramentoFinalizarCentral));
  if (processo.justificativaAtraso) {
    addRow('Justificativa de Atraso', processo.justificativaAtraso);
  }
  addList('Atendimento Vistoria', processo.atendimentoVistoria);
  const tacografoLabel = processo.tacografoColetado === 'sim' ? 'Sim' : processo.tacografoColetado === 'nao' ? 'N\u00e3o' : 'N\u00e3o necess\u00e1rio';
  addRow('Tac\u00f3grafo Coletado', tacografoLabel);
  if (processo.tacografoColetado === 'nao' && processo.motivoTacografoNaoColetado) {
    addRow('Motivo', processo.motivoTacografoNaoColetado);
  }
  addRow('Velocidade Registrada', processo.velocidadeRegistrada);
  addRow('Velocidade Permitida', processo.velocidadePermitida);
  addRow('Disco Vencido', boolText(processo.discoVencido));
  y += 3;

  sectionTitle('3. CHECKLIST OPERACIONAL');
  addRow('Documentos / Fotos Recebidos', boolText(processo.documentosFotosRecebidos));
  addRow('Custos Aprovados no Hist\u00f3rico', boolText(processo.custosAprovados));
  addRow('Hist\u00f3rico do Processo', processo.historicoStatus);
  addRow('Salvados Lan\u00e7ados', processo.salvadosLancados);
  addRow('Vistoriador Encerrado no Sistema', boolText(processo.vistoriadorEncerrado));
  addRow('Tratativas E-mail Encerradas', boolText(processo.tratativasEmailEncerradas));
  addRow('Invent\u00e1rio de Salvados', boolText(processo.inventarioSalvados));
  addRow('Documentos Assinados', boolText(processo.documentosAssinados));
  if (!processo.documentosAssinados && processo.documentosAssinadosJustificativa) {
    addRow('Justificativa', processo.documentosAssinadosJustificativa);
  }
  addRow('N\u00e3o Conformidade', boolText(processo.naoConformidade));
  if (processo.naoConformidade && processo.naoConformidadeDescricao) {
    addRow('Descri\u00e7\u00e3o NC', processo.naoConformidadeDescricao);
  }
  addList('Checklist Especial', processo.checklistEspecial);
  addRow('Mercadorias/Equip. sem Info', boolText(processo.mercadoriasSemInfo));
  addRow('Limpeza de Pista sem Tratativas', boolText(processo.limpezaPistaSemTratativas));
  addRow('Per\u00edcia Sindicante', boolText(processo.periciaSindicante));
  addRow('Acionamento Sindic\u00e2ncia', boolText(processo.acionamentoSindicancia));
  addRow('Altera\u00e7\u00e3o de Reserva', boolText(processo.alteracaoReserva));
  addRow('Custos Lan\u00e7ados', boolText(processo.custosLancados));
  addRow('Custos Ultrapassaram Autonomia', processo.custosUltrapassaramAutonomia || 'N/A');
  if (processo.custosUltrapassaramAutonomia === 'sim') {
    addRow('Seguradora Notificada', boolText(processo.seguradoraNotificada));
  }
  addRow('Info. Complementares Lan\u00e7adas', boolText(processo.informacoesComplementaresLancadas));
  addRow('Lona e Ve\u00edculo Inspecionados', boolText(processo.lonaVeiculoInspecionados));
  addRow('Furos na Lona', boolText(processo.furosNaLona));
  addRow('Todas Lonas Inspecionadas', boolText(processo.todasLonasInspecionadas));
  y += 3;

  sectionTitle('4. PREJU\u00cdZO / MEM\u00d3RIA DE C\u00c1LCULO');
  addRow('Preju\u00edzo Apurado', boolText(processo.prejuizoApurado));
  if (!processo.prejuizoApurado && processo.motivoPrejuizoNaoApurado) {
    addRow('Motivo', processo.motivoPrejuizoNaoApurado);
  }
  if (processo.prejuizoApurado) {
    y += 2;
    autoTable(doc, {
      startY: y,
      margin: { left: margin + 2, right: margin + 2 },
      head: [['Item', 'Valor (R$)']],
      body: [
        ['Total Embarcado', formatCurrency(processo.totalEmbarcado)],
        ['Total Recebido', formatCurrency(processo.totalRecebido)],
        ['Total Recusado', formatCurrency(processo.totalRecusado)],
        ['Salvados', formatCurrency(processo.salvadosValor)],
        ['Dispers\u00e3o / Saque', formatCurrency(processo.dispersaoSaque)],
      ],
      foot: [['MEM\u00d3RIA DE C\u00c1LCULO', formatCurrency(
        processo.totalEmbarcado - processo.totalRecebido - processo.totalRecusado - processo.salvadosValor + processo.dispersaoSaque
      )]],
      headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
      footStyles: { fillColor: [239, 246, 255], textColor: [30, 64, 175], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }
  y += 3;

  sectionTitle('5. FINALIZAR CENTRAL');
  addRow('Modelo', processo.modeloFinalizarCentral);
  addRow('Causa do Evento', processo.causaEvento);
  addRow('Relato do Motorista', processo.relatoMotorista);
  addRow('Resumo do Atendimento', processo.resumoAtendimento);
  addRow('Local do Evento', processo.localEvento);
  addRow('Disco Tac\u00f3grafo', processo.discoTacografo);
  addRow('Parecer Velocidade', processo.parecerVelocidade);
  y += 3;

  sectionTitle('6. ACIONAMENTO / ATENDIMENTO / PROVID\u00caNCIAS');
  addRow('Acionamento/Comunicado', processo.acionamentoComunicado);
  addRow('Realizado Por', processo.realizadoPor);
  addRow('Hor\u00e1rio', processo.horarioAcionamento);
  addRow('Atendimento In Loco', boolText(processo.atendimentoInLoco));
  addRow('Situa\u00e7\u00e3o do Ve\u00edculo', processo.situacaoVeiculo);
  addRow('Condi\u00e7\u00f5es da Mercadoria', processo.condicoesMercadoria);
  addRow('Destina\u00e7\u00e3o da Mercadoria', processo.destinacaoMercadoria);
  addRow('Descri\u00e7\u00e3o do Atendimento', processo.descricaoAtendimento);
  if (processo.observacaoAtendimento) {
    addRow('Observa\u00e7\u00e3o', processo.observacaoAtendimento);
  }
  addList('Documentos Pendentes', processo.documentosPendentes);
  addRow('Vistoria Final', processo.vistoriaFinal);
  y += 6;

  if (y > 240) { doc.addPage(); y = margin; }

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  sectionTitle('ASSINATURA DIGITAL');

  const dataHora = new Date().toLocaleString('pt-BR');
  addRow('Operador Respons\u00e1vel', processo.operador);
  addRow('Data/Hora da Emiss\u00e3o', dataHora);
  addRow('C\u00f3digo de Verifica\u00e7\u00e3o', generateVerificationCode(processo));

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

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Wagner Reguladora \u2014 Finaliza\u00e7\u00e3o Central | P\u00e1gina ${i} de ${totalPages} | Gerado em ${dataHora}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`Relatorio_${processo.numero}_${processo.dataAbertura}.pdf`);
}
