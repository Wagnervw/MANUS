// Dashboard — Wagner Reguladora - Finalização Central
// Design: Corporate Precision — #1e40af navy
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProcessos } from '@/contexts/SinistrosContext';
import {
  operadoresDemo,
  calcularBonificacao,
  progressoProximaBonificacao,
  calcularFaixa,
  BONIFICACAO_MARCO,
  BONIFICACAO_VALOR,
  FAIXAS_BONIFICACAO,
  getFaixaColor,
  getFaixaBgColor,
  processosPorMes,
  processosPorStatus,
  processosPorCausa,
} from '@/lib/data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { CircleCheck as CheckCircle2, Clock, TriangleAlert as AlertTriangle, TrendingUp, DollarSign, Award, Trophy } from 'lucide-react';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663134927829/ZdDkYSKthhyyCPQ5Q4kgLX/wagner-hero-banner-hkHKaZYxrfDlKE2dKjKNwp.webp';

function StatCard({ title, value, subtitle, icon: Icon, color, accentGradient }: {
  title: string; value: string | number; subtitle: string; icon: React.ElementType; color: string; accentGradient: string;
}) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className={`absolute inset-0 opacity-[0.04] ${accentGradient}`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1.5 tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { processos } = useProcessos();

  const stats = useMemo(() => {
    const concluidos = processos.filter(p => p.status === 'Concluído').length;
    const emAndamento = processos.filter(p => p.status === 'Em andamento').length;
    const pendentes = processos.filter(p => p.status === 'Pendente').length;
    return { total: processos.length, concluidos, emAndamento, pendentes };
  }, [processos]);

  // Current user (Vinicius) data
  const currentOperador = operadoresDemo[0];
  const bonificacaoTotal = calcularBonificacao(currentOperador.processosConcluidos);
  const progressoBonus = progressoProximaBonificacao(currentOperador.processosConcluidos);
  const faixaAtual = calcularFaixa(currentOperador.processosConcluidos);

  return (
    <div className="space-y-6">
      {/* Header with hero background */}
      <div className="relative rounded-2xl overflow-hidden h-32 md:h-36 shadow-lg">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-blue-900/85 to-blue-800/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]" />
        <div className="relative h-full flex items-center px-6 md:px-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-sm text-blue-100/70 mt-1 font-medium">Visao geral da operacao -- Finalizacao Central</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Processos" value={stats.total} subtitle="este mês" icon={TrendingUp} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" accentGradient="bg-gradient-to-br from-blue-500 to-blue-700" />
        <StatCard title="Concluídos" value={stats.concluidos} subtitle="finalizados" icon={CheckCircle2} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" accentGradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        <StatCard title="Em Andamento" value={stats.emAndamento} subtitle="em processamento" icon={Clock} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" accentGradient="bg-gradient-to-br from-amber-400 to-amber-600" />
        <StatCard title="Pendentes" value={stats.pendentes} subtitle="aguardando ação" icon={AlertTriangle} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" accentGradient="bg-gradient-to-br from-red-500 to-red-700" />
      </div>

      {/* Bonificação + Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bonificação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Bonificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">R$ {bonificacaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground mt-0.5">acumulado ({currentOperador.processosConcluidos} processos concluídos)</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg ${getFaixaBgColor(faixaAtual)}`}>
                <span className={`text-sm font-bold capitalize ${getFaixaColor(faixaAtual)}`}>{faixaAtual}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso para próxima bonificação</span>
                <span className="font-semibold text-foreground">{progressoBonus}/{BONIFICACAO_MARCO}</span>
              </div>
              <Progress value={(progressoBonus / BONIFICACAO_MARCO) * 100} className="h-2.5" />
              <p className="text-[11px] text-muted-foreground">
                Faltam <strong>{BONIFICACAO_MARCO - progressoBonus}</strong> processos para +R$ {BONIFICACAO_VALOR}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">{currentOperador.processosEmAndamento}</p>
                <p className="text-[10px] text-muted-foreground">Em andamento</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">{currentOperador.processosPendentes}</p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faixas de bonificação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-600" />
              Faixas de Bonificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {FAIXAS_BONIFICACAO.map(f => {
                const isActive = faixaAtual === f.faixa.toLowerCase();
                return (
                  <div key={f.faixa} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}>
                    <span className="text-xl">{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{f.faixa}</span>
                        {isActive && <Badge variant="default" className="text-[10px] h-4 px-1.5">Atual</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{f.processos} processos</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{f.bonus}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Processos por mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processosPorMes}>
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#1e40af" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                  <Area type="monotone" dataKey="quantidade" stroke="#2563eb" fill="url(#gradBlue)" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="gradConcluido" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="gradAndamento" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="gradPendente" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                  <Pie data={processosPorStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="quantidade" nameKey="status" label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} cornerRadius={3}>
                    {processosPorStatus.map((entry, i) => (
                      <Cell key={i} fill={['url(#gradConcluido)', 'url(#gradAndamento)', 'url(#gradPendente)'][i]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processos por causa + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por causa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processos por Causa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processosPorCausa} layout="vertical">
                  <defs>
                    <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1e40af" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis dataKey="causa" type="category" tick={{ fontSize: 11 }} width={90} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} cursor={{ fill: 'var(--accent)', opacity: 0.3 }} />
                  <Bar dataKey="quantidade" fill="url(#gradBar)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ranking dos operadores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              Ranking dos Operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operadoresDemo
                .sort((a, b) => b.processosConcluidos - a.processosConcluidos)
                .map((op, i) => {
                  const bonus = calcularBonificacao(op.processosConcluidos);
                  const faixa = calcularFaixa(op.processosConcluidos);
                  return (
                    <div key={op.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : i === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300' : i === 2 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {op.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{op.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{op.processosConcluidos} concluídos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {bonus}</p>
                        <p className={`text-[11px] font-medium capitalize ${getFaixaColor(faixa)}`}>{faixa}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
