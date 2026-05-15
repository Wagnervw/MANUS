// Relatórios — Wagner Reguladora - Finalização Central
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProcessos } from '@/contexts/SinistrosContext';
import {
  operadoresDemo,
  calcularBonificacao,
  calcularFaixa,
  getFaixaColor,
  processosPorMes,
  processosPorCausa,
} from '@/lib/data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, Users, TrendingUp, FileText } from 'lucide-react';

export default function Relatorios() {
  const { processos } = useProcessos();
  const [periodo, setPeriodo] = useState('todos');

  // Comparativo entre operadores
  const comparativo = useMemo(() => {
    return operadoresDemo.map(op => ({
      nome: op.nome.split(' ')[0],
      concluidos: op.processosConcluidos,
      emAndamento: op.processosEmAndamento,
      pendentes: op.processosPendentes,
      bonificacao: calcularBonificacao(op.processosConcluidos),
    }));
  }, []);

  // Resumo de desempenho
  const resumo = useMemo(() => {
    return operadoresDemo.map(op => {
      const faixa = calcularFaixa(op.processosConcluidos);
      const bonus = calcularBonificacao(op.processosConcluidos);
      const total = op.processosConcluidos + op.processosEmAndamento + op.processosPendentes;
      const taxa = total > 0 ? ((op.processosConcluidos / total) * 100).toFixed(1) : '0';
      return { ...op, faixa, bonus, total, taxa };
    });
  }, []);

  const totalGeral = processos.length;
  const totalConcluidos = processos.filter(p => p.status === 'Concluído').length;
  const totalPendentes = processos.filter(p => p.status === 'Pendente').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Análise de desempenho e produtividade da equipe</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os períodos</SelectItem>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="trimestre">Este trimestre</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalGeral}</p>
              <p className="text-xs text-muted-foreground">Total de processos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConcluidos}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{operadoresDemo.length}</p>
              <p className="text-xs text-muted-foreground">Operadores ativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo entre operadores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comparativo entre Operadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativo}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="concluidos" name="Concluídos" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emAndamento" name="Em andamento" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendentes" name="Pendentes" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Processos por mês + por causa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                  <Bar dataKey="quantidade" fill="#1e40af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por Causa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processosPorCausa} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis dataKey="causa" type="category" tick={{ fontSize: 11 }} width={90} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }} />
                  <Bar dataKey="quantidade" fill="#1e40af" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de desempenho */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo de Desempenho por Operador</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Concluídos</TableHead>
                  <TableHead className="text-center">Em andamento</TableHead>
                  <TableHead className="text-center">Pendentes</TableHead>
                  <TableHead className="text-center">Taxa</TableHead>
                  <TableHead className="text-center">Faixa</TableHead>
                  <TableHead className="text-right">Bonificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumo.map(op => (
                  <TableRow key={op.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{op.avatar}</div>
                        <span className="text-sm font-medium text-foreground">{op.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{op.total}</TableCell>
                    <TableCell className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{op.processosConcluidos}</TableCell>
                    <TableCell className="text-center text-sm text-amber-600 dark:text-amber-400">{op.processosEmAndamento}</TableCell>
                    <TableCell className="text-center text-sm text-red-600 dark:text-red-400">{op.processosPendentes}</TableCell>
                    <TableCell className="text-center text-sm">{op.taxa}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] capitalize ${getFaixaColor(op.faixa)}`}>{op.faixa}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {op.bonus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
