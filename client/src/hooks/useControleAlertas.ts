import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProcessoControleRow {
  id: string;
  numero: string;
  segurado: string;
  seguradora: string;
  conducao: string;
  abertura_sinistro: string;
  preliminar: string;
  custos: string;
  salvados: string;
}

export interface AlertaItem {
  id: string;
  numero: string;
  dias: number;
}

export interface ControleAlertas {
  preliminar: AlertaItem[];
  custos: AlertaItem[];
  salvados: AlertaItem[];
  total: number;
  loading: boolean;
  refresh: () => void;
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
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function calcAlertas(rows: ProcessoControleRow[]) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const preliminar: AlertaItem[] = [];
  const custos: AlertaItem[] = [];
  const salvados: AlertaItem[] = [];

  for (const r of rows) {
    const dtAbertura = parseDataBr(r.abertura_sinistro);
    if (!dtAbertura) continue;

    const prazo = new Date(dtAbertura);
    prazo.setDate(prazo.getDate() + 2);
    const diasAtraso = daysBetween(prazo, hoje);

    if (r.preliminar.toLowerCase() !== 'enviado' && diasAtraso >= 0) {
      preliminar.push({ id: r.id, numero: r.numero, dias: diasAtraso });
    }

    if (r.custos.toLowerCase() !== 'enviado' && diasAtraso >= 0) {
      custos.push({ id: r.id, numero: r.numero, dias: diasAtraso });
    }

    if (r.salvados.toLowerCase() === 'pendente') {
      salvados.push({ id: r.id, numero: r.numero, dias: daysBetween(dtAbertura, hoje) });
    }
  }

  return { preliminar, custos, salvados, total: preliminar.length + custos.length + salvados.length };
}

export function useControleAlertas(): ControleAlertas {
  const [rows, setRows] = useState<ProcessoControleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('processos_controle')
      .select('id, numero, segurado, seguradora, conducao, abertura_sinistro, preliminar, custos, salvados')
      .order('created_at', { ascending: false });

    if (data) setRows(data as ProcessoControleRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const alertas = useMemo(() => calcAlertas(rows), [rows]);

  return { ...alertas, loading, refresh: fetchData };
}

export { calcAlertas, parseDataBr, daysBetween };
