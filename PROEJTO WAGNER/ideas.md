# Wagner Seguros - Brainstorming de Design

## Contexto
Sistema profissional para gestão de sinistros de seguros. Operadores precisam de velocidade e eficiência. Interface tipo dashboard/admin panel com sidebar persistente.

---

<response>
## Ideia 1: "Command Center" - Estética de Centro de Controle Militar

<text>
**Design Movement**: Inspirado em interfaces de controle de missão/aviação - dados densos, alta legibilidade, zero decoração supérflua.

**Core Principles**:
1. Densidade informacional máxima sem sacrificar legibilidade
2. Hierarquia cromática funcional (cor = significado, nunca decoração)
3. Tipografia monoespacada para dados, sans-serif condensada para labels
4. Bordas finas e cantos retos - estética técnica/engenharia

**Color Philosophy**: Fundo escuro slate (#0F172A) com acentos em verde-ciano (#06B6D4) para ações positivas e âmbar (#F59E0B) para alertas. Branco puro apenas para dados primários. A paleta transmite seriedade operacional.

**Layout Paradigm**: Grid denso com sidebar compacta (ícones + texto condensado). Cards com bordas de 1px, sem sombras. Tabelas ocupam espaço máximo.

**Signature Elements**: Indicadores de status com dots pulsantes, barras de progresso lineares finas, badges monocromáticos.

**Interaction Philosophy**: Zero animações decorativas. Transições instantâneas. Feedback visual mínimo e preciso.

**Animation**: Apenas transições de opacidade em 100ms para tooltips. Nenhuma animação de entrada.

**Typography System**: JetBrains Mono para dados numéricos, IBM Plex Sans Condensed para labels e navegação.
</text>
<probability>0.06</probability>
</response>

---

<response>
## Ideia 2: "Corporate Precision" - Design Corporativo Refinado com Profundidade

<text>
**Design Movement**: Neo-corporativo com influência de design bancário europeu - sofisticado, confiável, com camadas sutis de profundidade.

**Core Principles**:
1. Confiança visual através de espaçamento generoso e tipografia autoritativa
2. Profundidade sutil com sombras em camadas e micro-gradientes
3. Paleta restrita com uso cirúrgico de cor para status e ações
4. Componentes com bordas suaves (radius 8-12px) e superfícies elevadas

**Color Philosophy**: Base em navy profundo (#1E293B) para sidebar e header, superfícies em branco quente (#FAFAF9) para áreas de trabalho. Azul corporativo (#2563EB) como primário, com verde esmeralda (#059669) para sucesso e vermelho controlado (#DC2626) para alertas. A paleta transmite solidez institucional.

**Layout Paradigm**: Sidebar fixa de 260px com agrupamento visual por seções. Área de conteúdo com cards em grid responsivo. Formulários em wizard com stepper horizontal proeminente. Tabelas com linhas alternadas e hover states suaves.

**Signature Elements**: 
- Stepper com círculos conectados por linhas, preenchimento progressivo em azul
- Cards de KPI com ícone à esquerda, número grande e variação percentual
- Badges de status com fundo translúcido e borda colorida

**Interaction Philosophy**: Micro-interações refinadas - hover eleva cards com sombra, botões têm scale sutil no active, transições suaves entre etapas do wizard.

**Animation**: 
- Cards entram com fade-up staggered (30ms delay entre items)
- Wizard transitions com slide horizontal (200ms ease-out)
- Barras de progresso animam com ease-in-out em 600ms
- Hover em cards: translateY(-2px) + shadow increase em 180ms

**Typography System**: DM Sans (600-700) para headings e números de destaque, Inter (400-500) para corpo e labels. Números tabulares para dados financeiros.
</text>
<probability>0.08</probability>
</response>

---

<response>
## Ideia 3: "Flat Operational" - Minimalismo Funcional Escandinavo

<text>
**Design Movement**: Design escandinavo aplicado a software - clareza absoluta, sem ornamentos, foco na tarefa.

**Core Principles**:
1. Cada pixel serve a uma função
2. Contraste alto entre elementos interativos e decorativos
3. Espaço negativo como elemento de design principal
4. Cores planas sem gradientes, sem sombras

**Color Philosophy**: Fundo branco puro, textos em preto 90%, um único azul (#3B82F6) para todas as ações. Status em cores semafóricas puras. Zero decoração cromática.

**Layout Paradigm**: Sidebar minimalista com ícones grandes e labels pequenos. Conteúdo em coluna única centralizada com max-width restrito.

**Signature Elements**: Linhas horizontais como divisores, tipografia oversized para números de KPI, checkboxes customizados com animação de tick.

**Interaction Philosophy**: Transições rápidas e mecânicas. Focus states proeminentes para acessibilidade.

**Animation**: Apenas focus rings animados e checkbox tick animations. Nada mais.

**Typography System**: Söhne ou fallback para system-ui. Peso único (400) com variação apenas por tamanho.
</text>
<probability>0.04</probability>
</response>

---

## Decisão

**Escolha: Ideia 2 - "Corporate Precision"**

Esta abordagem é a mais adequada para uma empresa de seguros porque:
- Transmite confiança e solidez institucional
- O espaçamento generoso e a profundidade visual facilitam a leitura rápida de dados
- A paleta navy + azul corporativo é perfeita para o setor de seguros
- As micro-interações refinadas tornam a experiência agradável sem distrair
- O sistema de tipografia com DM Sans permite números de destaque legíveis
