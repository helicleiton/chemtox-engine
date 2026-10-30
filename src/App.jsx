import React, { useEffect, useMemo, useState } from 'react';
import {
  FlaskConical, AlertTriangle, ShieldAlert, Thermometer, Activity,
  FileText, Plus, RefreshCw, Printer, Filter, Clock, Info, Search, X
} from 'lucide-react';

// ptoxicidade e reatividade: "aquoso" indica se a substância contém água (padrão: sim)
const SUBSTANCIAS = [
  // Ácidos
  { id: 'h2so4', nome: 'Ácido Sulfúrico', formula: 'H₂SO₄', categoria: 'Ácidos', ph: 0.5, cor: '#ef4444', tipo: 'acid',
    descricao: 'Ácido mineral forte, corrosivo e desidratante. Causa queimaduras profundas e reage com exotermia.' },
  { id: 'hcl', nome: 'Ácido Clorídrico (Muriático)', formula: 'HCl', categoria: 'Ácidos', ph: 0.8, cor: '#f87171', tipo: 'acid',
    descricao: 'Ácido mineral forte usado em limpeza de pisos. Libera vapores irritantes e corrói tecidos.' },
  { id: 'hno3', nome: 'Ácido Nítrico', formula: 'HNO₃', categoria: 'Ácidos', ph: 1.0, cor: '#facc15', tipo: 'acid',
    descricao: 'Ácido forte e oxidante. Causa queimaduras químicas e libera vapores nitrosos tóxicos.' },
  { id: 'vinagre', nome: 'Vinagre (Ácido Acético 5%)', formula: 'CH₃COOH', categoria: 'Ácidos', ph: 2.5, cor: '#fde68a', tipo: 'acid',
    descricao: 'Ácido fraco de uso culinário. Em concentração doméstica causa irritação leve.' },
  { id: 'citrico', nome: 'Ácido Cítrico', formula: 'C₆H₈O₇', categoria: 'Ácidos', ph: 2.4, cor: '#fef08a', tipo: 'acid',
    descricao: 'Ácido orgânico fraco presente em frutas cítricas e usado como acidulante alimentar.' },

  // Bases
  { id: 'naoh', nome: 'Soda Cáustica (Hidróxido de Sódio)', formula: 'NaOH', categoria: 'Bases', ph: 13.5, cor: '#3b82f6', tipo: 'base',
    descricao: 'Base forte e corrosiva. Saponifica tecidos e gera calor ao se dissolver em água.' },
  { id: 'amonia', nome: 'Amônia Doméstica', formula: 'NH₃', categoria: 'Bases', ph: 11.3, cor: '#60a5fa', tipo: 'base',
    descricao: 'Base volátil de limpeza. Vapores irritam olhos e vias respiratórias.' },
  { id: 'bicarbonato', nome: 'Bicarbonato de Sódio', formula: 'NaHCO₃', categoria: 'Bases', ph: 8.3, cor: '#e0f2fe', tipo: 'base',
    descricao: 'Base fraca usada como fermento e antiácido. Praticamente inofensivo em uso doméstico.' },
  { id: 'cal', nome: 'Hidróxido de Cálcio (Cal Hidratada)', formula: 'Ca(OH)₂', categoria: 'Bases', ph: 12.4, cor: '#e2e8f0', tipo: 'base',
    descricao: 'Base pouco solúvel usada em construção. Pó e suspensão causam queimaduras nos olhos e pele.' },

  // Produtos domésticos
  { id: 'bleach', nome: 'Água Sanitária (Hipoclorito de Sódio)', formula: 'NaClO', categoria: 'Produtos Domésticos', ph: 11.5, cor: '#eab308', tipo: 'household', oxidante: true,
    descricao: 'Desinfetante oxidante. Nunca misturar com ácidos ou amônia: libera gases tóxicos.' },
  { id: 'detergente', nome: 'Detergente Neutro', formula: 'LAS (surfactante)', categoria: 'Produtos Domésticos', ph: 7.0, cor: '#86efac', tipo: 'surfactant', detergente: true,
    descricao: 'Surfactante de uso doméstico. Baixa toxicidade, mas causa irritação ocular.' },
  { id: 'desentupidor', nome: 'Desentupidor Enzimático', formula: 'Enzimas + NaOH', categoria: 'Produtos Domésticos', ph: 9.0, cor: '#a3e635', tipo: 'household',
    descricao: 'Mistura de enzimas e agentes alcalinos. Irritante para pele e olhos.' },
  { id: 'h2o2', nome: 'Água Oxigenada 10 volumes', formula: 'H₂O₂', categoria: 'Produtos Domésticos', ph: 4.5, cor: '#f0fdfa', tipo: 'peroxide', peroxido: true,
    descricao: 'Agente oxidante de baixa concentração. Decompõe-se liberando oxigênio, o que pode formar espuma.' },
  { id: 'sabao', nome: 'Sabão Líquido', formula: 'RCOONa', categoria: 'Produtos Domésticos', ph: 10.0, cor: '#f9a8d4', tipo: 'soap',
    descricao: 'Sal alcalino de ácido graxo, usado na limpeza.' },
  { id: 'oleo', nome: 'Óleo Vegetal', formula: 'C₃H₅(OOCR)₃', categoria: 'Produtos Domésticos', ph: 7.0, cor: '#fcd34d', tipo: 'oil', aquoso: false,
    descricao: 'Triglicerídeos de origem vegetal, base da saponificação.' },

  // Medicamentos
  { id: 'paracetamol', nome: 'Paracetamol', formula: 'C₈H₉NO₂', categoria: 'Medicamentos', ph: 6.0, cor: '#a855f7', tipo: 'pharma',
    descricao: 'Analgésico e antitérmico. Em excesso, causa lesão hepática, agravada pelo álcool.' },
  { id: 'aspirina', nome: 'Ácido Acetilsalicílico (Aspirina)', formula: 'C₉H₈O₄', categoria: 'Medicamentos', ph: 3.0, cor: '#c4b5fd', tipo: 'pharma',
    descricao: 'Anti-inflamatório e antiagregante. Em excesso, causa irritação gástrica e acidose.' },
  { id: 'ibuprofeno', nome: 'Ibuprofeno', formula: 'C₁₃H₁₈O₂', categoria: 'Medicamentos', ph: 4.5, cor: '#ddd6fe', tipo: 'pharma',
    descricao: 'Anti-inflamatório não esteroide. Em excesso, pode irritar a mucosa gástrica.' },
  { id: 'codeina', nome: 'Xarope com Codeína', formula: 'C₁₈H₂₁NO₃', categoria: 'Medicamentos', ph: 5.5, cor: '#8b5cf6', tipo: 'pharma', opioide: true,
    descricao: 'Antitussígeno opioide. Potencializa a depressão do SNC e respiratória quando combinado com álcool.' },

  // Solventes e orgânicos
  { id: 'alcohol', nome: 'Álcool Etílico 70%', formula: 'C₂H₅OH', categoria: 'Solventes', ph: 7.0, cor: '#06b6d4', tipo: 'solvent',
    descricao: 'Solvente inflamável e depressor do SNC.' },
  { id: 'acetona', nome: 'Acetona', formula: 'C₃H₆O', categoria: 'Solventes', ph: 7.0, cor: '#67e8f9', tipo: 'solvent', aquoso: false,
    descricao: 'Solvente volátil e altamente inflamável. Vapores causam tontura e irritação das vias aéreas.' },
  { id: 'gasolina', nome: 'Gasolina (Hidrocarbonetos)', formula: 'C₄–C₁₂', categoria: 'Solventes', ph: 7.0, cor: '#fb923c', tipo: 'solvent', aquoso: false,
    descricao: 'Mistura de hidrocarbonetos inflamável. Aspiração pode causar pneumonia química.' },
  { id: 'metanol', nome: 'Metanol', formula: 'CH₃OH', categoria: 'Solventes', ph: 7.0, cor: '#22d3ee', tipo: 'solvent', metanol: true,
    descricao: 'Álcool tóxico. Metabolizado em produtos que causam acidose metabólica e danos ao nervo óptico.' },

  // Sais e metais
  { id: 'nacl', nome: 'Cloreto de Sódio (Sal de Cozinha)', formula: 'NaCl', categoria: 'Sais & Metais', ph: 7.0, cor: '#e2e8f0', tipo: 'salt',
    descricao: 'Sal neutro de uso alimentício.' },
  { id: 'cuso4', nome: 'Sulfato de Cobre', formula: 'CuSO₄', categoria: 'Sais & Metais', ph: 4.5, cor: '#2563eb', tipo: 'salt',
    descricao: 'Sal azul tóxico se ingerido. Irrita pele e olhos e causa danos ao fígado e rins em excesso.' },
  { id: 'sodio', nome: 'Sódio Metálico', formula: 'Na', categoria: 'Sais & Metais', ph: null, cor: '#94a3b8', tipo: 'metal', aquoso: false,
    descricao: 'Metal alcalino extremamente reativo com água e umidade. Uso exclusivo em laboratório, com EPI.' }
];

const FILTROS = [
  { rotulo: 'Todos', valor: null },
  { rotulo: 'Ácidos', valor: 'Ácidos' },
  { rotulo: 'Bases', valor: 'Bases' },
  { rotulo: 'Domésticos', valor: 'Produtos Domésticos' },
  { rotulo: 'Medicamentos', valor: 'Medicamentos' },
  { rotulo: 'Solventes', valor: 'Solventes' },
  { rotulo: 'Sais/Metais', valor: 'Sais & Metais' }
];

const CATEGORIAS = FILTROS.filter((f) => f.valor).map((f) => f.valor);

const CHAVE_PERSONALIZADAS = 'chemtox-substancias-personalizadas';

const MISTURAS_RAPIDAS = [
  { id: 'cloro', emoji: '💣', nome: 'Água Sanitária + Vinagre', efeito: 'Gás Cloro Tóxico', ids: ['bleach', 'vinagre'] },
  { id: 'neutralizacao', emoji: '💥', nome: 'Ácido Sulfúrico + Soda Cáustica', efeito: 'Neutralização Violenta', ids: ['h2so4', 'naoh'] },
  { id: 'figado', emoji: '💊', nome: 'Álcool + Paracetamol', efeito: 'Sobrecarga Hepática', ids: ['alcohol', 'paracetamol'] },
  { id: 'saponificacao', emoji: '🧼', nome: 'Sabão + Óleo Vegetal', efeito: 'Saponificação', ids: ['sabao', 'oleo'] }
];

const CORES = {
  fundo: '#020617',
  superficie: '#0f172a',
  superficieAlt: '#1e293b',
  borda: '#1e293b',
  bordaForte: '#334155',
  texto: '#f1f5f9',
  textoSecundario: '#94a3b8',
  textoSutil: '#64748b',
  cyan: '#22d3ee',
  azul: '#3b82f6',
  vermelho: '#ef4444',
  amarelo: '#eab308',
  laranja: '#f97316',
  roxo: '#a855f7',
  rosa: '#fb7185'
};

// Paradas da escala de pH usadas para colorir a solução
const PARADAS_PH = [
  [0, '#ef4444'],
  [3, '#f97316'],
  [5, '#eab308'],
  [7, '#84cc16'],
  [9, '#14b8a6'],
  [11, '#3b82f6'],
  [13, '#6366f1'],
  [14, '#a855f7']
];

const DETALHES_ORGAOS = {
  cerebro: {
    1: { dano: 'Depressão do SNC: sonolência, confusão, perda de reflexos e coordenação.', tempo: 'Minutos a horas' },
    2: { dano: 'Hipóxia e depressão do SNC e respiratória: tontura, convulsões e risco de coma.', tempo: '0 a 15 minutos' }
  },
  boca: {
    1: { dano: 'Irritação da mucosa oral e esofágica.', tempo: 'Minutos após o contato' },
    2: { dano: 'Queimaduras químicas imediatas nas mucosas, corrosão de tecidos moles, dor intensa e risco de edema de glote.', tempo: 'Imediato (0 a 2 minutos)' }
  },
  estomago: {
    1: { dano: 'Alteração do pH gástrico, distensão e náusea.', tempo: '30 minutos a 2 horas' },
    2: { dano: 'Reação exotérmica ou gasosa no estômago, distensão intensa e risco de perfuração da parede gástrica.', tempo: '5 a 30 minutos' }
  },
  figado: {
    1: { dano: 'Sobrecarga metabólica hepática pelo paracetamol.', tempo: '24 a 72 horas' },
    2: { dano: 'Necrose hepática aguda potencializada pelo álcool. Risco de Necrose Tubular Aguda (NTA) nos rins.', tempo: '24 a 72 horas (fase silenciosa)' }
  },
  coracao: {
    1: { dano: 'Taquicardia e alteração do equilíbrio ácido-base.', tempo: 'Horas' },
    2: { dano: 'Choque, arritmias e colapso cardiorrespiratório por acidose ou alcalose severa.', tempo: '15 a 60 minutos' }
  }
};

const ROTULOS_ORGAOS = [
  { id: 'cerebro', texto: 'Cérebro / SNC', lado: 'direita', y: 30, px: 117, py: 32 },
  { id: 'boca', texto: 'Boca / Esôfago', lado: 'esquerda', y: 56, px: 92, py: 56 },
  { id: 'coracao', texto: 'Coração', lado: 'direita', y: 110, px: 88, py: 108 },
  { id: 'estomago', texto: 'Estômago', lado: 'direita', y: 160, px: 122, py: 150 },
  { id: 'figado', texto: 'Fígado / Rins', lado: 'esquerda', y: 170, px: 80, py: 168 }
];

const estilos = {
  pagina: {
    minHeight: '100vh',
    background: CORES.fundo,
    color: CORES.texto,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 48
  },
  cabecalho: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(8px)',
    borderBottom: `1px solid ${CORES.borda}`,
    padding: '16px 24px'
  },
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 24px'
  },
  cartao: {
    background: CORES.superficie,
    border: `1px solid ${CORES.borda}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.6)'
  },
  tituloSecao: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: CORES.texto
  },
  rotulo: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: CORES.textoSecundario,
    margin: 0
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: CORES.superficieAlt,
    border: `1px solid ${CORES.bordaForte}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: CORES.texto,
    fontSize: 13,
    outline: 'none'
  },
  botao: {
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#fff',
    transition: 'background 0.2s, transform 0.1s'
  }
};

const KEYFRAMES = `
@keyframes bolhaSobe {
  0% { transform: translateY(0) scale(1); opacity: 0.9; }
  100% { transform: translateY(-180px) scale(0.5); opacity: 0; }
}
@keyframes fumaca {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  25% { opacity: 0.7; }
  100% { transform: translateY(-80px) scale(1.9); opacity: 0; }
}
@keyframes pulsoNeon {
  0%, 100% { box-shadow: 0 0 6px var(--cor), 0 0 14px var(--cor); }
  50% { box-shadow: 0 0 14px var(--cor), 0 0 36px var(--cor); }
}
@keyframes piscaVermelho {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 0 #ef4444); }
  50% { opacity: 0.45; filter: drop-shadow(0 0 10px #ef4444); }
}
@keyframes piscaAmarelo {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 0 #eab308); }
  50% { opacity: 0.5; filter: drop-shadow(0 0 8px #eab308); }
}
button:focus-visible, select:focus-visible, input:focus-visible {
  outline: 2px solid #22d3ee;
  outline-offset: 2px;
}
@media print {
  .no-print { display: none !important; }
  body { background: #fff !important; }
}
`;

const SUBSCRITOS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

// Remove acentos, subscritos viram dígitos e ignora maiúsculas e espaços (busca "H2SO4" acha "H₂SO₄")
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[₀-₉]/g, (d) => SUBSCRITOS[d])
    .toLowerCase()
    .replace(/\s+/g, '');
}

function phTexto(ph) {
  return ph === null ? '—' : ph;
}

function hexParaRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Cor base da solução, interpolada pela escala de pH
function corPorPH(ph) {
  const p = Math.min(Math.max(ph, 0), 14);
  for (let i = 0; i < PARADAS_PH.length - 1; i++) {
    const [p1, c1] = PARADAS_PH[i];
    const [p2, c2] = PARADAS_PH[i + 1];
    if (p <= p2) {
      const t = (p - p1) / (p2 - p1);
      const a = hexParaRgb(c1);
      const b = hexParaRgb(c2);
      return a.map((v, k) => v + (b[k] - v) * t);
    }
  }
  return hexParaRgb(PARADAS_PH[PARADAS_PH.length - 1][1]);
}

// Solução: 70% da cor do pH + 30% da média dos reagentes
function corDaSolucao(sel, ph) {
  if (sel.length === 0) return CORES.bordaForte;
  const base = corPorPH(ph);
  const reagentes = sel.map((s) => hexParaRgb(s.cor));
  const media = [0, 1, 2].map((i) => reagentes.reduce((acc, c) => acc + c[i], 0) / reagentes.length);
  const mistura = base.map((v, i) => Math.round(v * 0.7 + media[i] * 0.3));
  return `rgb(${mistura.join(', ')})`;
}

// Detecta o cenário da mistura. "gravidade": 0 = fatal, 1 = alto, 2 = moderado
function analisarReacao(sel) {
  const tem = (pred) => sel.some(pred);
  const acido = tem((s) => s.ph !== null && s.ph < 4);
  const base = tem((s) => s.ph !== null && s.ph > 10 && !s.oxidante);
  const oxidante = tem((s) => s.oxidante);
  const amonia = tem((s) => s.id === 'amonia');
  const sodio = tem((s) => s.id === 'sodio');
  const aquosoComSodio = tem((s) => s.id !== 'sodio' && s.aquoso !== false);
  const peroxido = tem((s) => s.peroxido);
  const detergente = tem((s) => s.detergente);
  const sabao = tem((s) => s.tipo === 'soap');
  const oleo = tem((s) => s.tipo === 'oil');

  if (sodio && aquosoComSodio) {
    return {
      tipo: 'hidrogenio', titulo: 'Reação explosiva com água', deltaT: 60, gravidade: 0, bolhas: true, gas: 'rgba(226, 232, 240, 0.4)',
      equacao: '2Na + 2H₂O → 2NaOH + H₂↑ (Explosão e liberação de Hidrogênio)'
    };
  }
  if (oxidante && acido) {
    return {
      tipo: 'cloro', titulo: 'Liberação de gás cloro', deltaT: 30, gravidade: 0, bolhas: true, gas: 'rgba(190, 242, 100, 0.55)',
      equacao: 'NaClO + H⁺ → HClO ⇌ Cl₂↑ + H₂O (Gás Cloro Tóxico)'
    };
  }
  if (oxidante && amonia) {
    return {
      tipo: 'cloramina', titulo: 'Formação de cloraminas', deltaT: 25, gravidade: 0, bolhas: true, gas: 'rgba(217, 249, 157, 0.5)',
      equacao: 'NH₃ + HOCl → NH₂Cl (Cloraminas, gás sufocante) + H₂O'
    };
  }
  if (acido && base) {
    return {
      tipo: 'neutralizacao', titulo: 'Neutralização ácido-base', deltaT: 45, gravidade: tem((s) => s.ph !== null && s.ph < 2) ? 0 : 1,
      bolhas: true, gas: 'rgba(226, 232, 240, 0.5)',
      equacao: 'H⁺ + OH⁻ → H₂O + Calor (Neutralização Violenta)'
    };
  }
  if (peroxido && detergente) {
    return {
      tipo: 'oxigenio', titulo: 'Efervescência de oxigênio', deltaT: 8, gravidade: 1, bolhas: true, gas: null,
      equacao: '2H₂O₂ → 2H₂O + O₂↑ (decomposição catalisada, com espuma)'
    };
  }
  if (sodio) {
    return {
      tipo: 'metal', titulo: 'Metal reativo', deltaT: 4, gravidade: 1, bolhas: false, gas: null,
      equacao: 'Na + H₂O → NaOH + ½H₂↑ (reage com umidade)'
    };
  }
  if (sabao && oleo) {
    return {
      tipo: 'saponificacao', titulo: 'Saponificação', deltaT: 6, gravidade: 2, bolhas: false, gas: null,
      equacao: 'Óleo (triglicerídeo) + Base → Sabão + Glicerol (Saponificação)'
    };
  }
  return { tipo: 'nenhuma', titulo: 'Sem reação direta', deltaT: 2, gravidade: 2, bolhas: false, gas: null, equacao: 'Mistura em Solução Aquosa / Sem Reação Direta' };
}

function calcularSeveridade(sel, reacao) {
  if (sel.length === 0) {
    return { nivel: 'SEM MISTURA', cor: '#475569', tempo: 'Sem risco imediato', indice: -1 };
  }
  const porPH = sel.some((s) => s.ph !== null && (s.ph < 3 || s.ph > 11)) ? 1 : 2;
  const indice = Math.min(reacao.gravidade, porPH);
  if (indice === 0) {
    return { nivel: 'FATAL / CRÍTICO', cor: '#dc2626', tempo: 'Crítico: primeiros 15 minutos', indice };
  }
  if (indice === 1) {
    return { nivel: 'ALTO RISCO', cor: CORES.laranja, tempo: 'Urgente: até 1 hora', indice };
  }
  return { nivel: 'MODERADO / BAIXO', cor: '#ca8a04', tempo: 'Observação: até 4 horas', indice };
}

// Nível de dano de cada órgão: 0 = sem risco, 1 = atenção, 2 = crítico
function avaliarOrgaos(sel, reacao, severidade) {
  const t = reacao.tipo;
  const gasTox = t === 'cloro' || t === 'cloramina';
  const reagiu = ['cloro', 'cloramina', 'neutralizacao', 'hidrogenio'].includes(t);
  const corrosivo = sel.some((s) => s.ph !== null && (s.ph < 2 || s.ph > 11));
  const extremo = sel.some((s) => s.ph !== null && (s.ph < 4 || s.ph > 9));
  const paracetamol = sel.some((s) => s.id === 'paracetamol');
  const alcool = sel.some((s) => s.id === 'alcohol');
  const opioide = sel.some((s) => s.opioide);
  const metanol = sel.some((s) => s.metanol);

  return [
    {
      id: 'cerebro',
      nome: 'Cérebro / SNC',
      nivel: gasTox || (alcool && opioide) ? 2 : alcool || opioide || metanol ? 1 : 0,
      causa: gasTox
        ? 'Inalação de gases tóxicos'
        : alcool && opioide
        ? 'Álcool + opioide (depressão respiratória)'
        : metanol
        ? 'Metanol (toxicidade sistêmica)'
        : alcool
        ? 'Álcool etílico (depressor do SNC)'
        : 'Opioide (depressão do SNC)'
    },
    {
      id: 'boca',
      nome: 'Boca / Esôfago',
      nivel: corrosivo || gasTox || t === 'hidrogenio' ? 2 : extremo || t === 'oxigenio' ? 1 : 0,
      causa: corrosivo ? 'Agente corrosivo ácido ou base' : gasTox ? 'Vapores tóxicos' : t === 'hidrogenio' ? 'Projeção de álcali' : 'Contato com pH extremo'
    },
    {
      id: 'estomago',
      nome: 'Estômago',
      nivel: reagiu || corrosivo ? 2 : extremo || t === 'oxigenio' ? 1 : 0,
      causa: reagiu ? 'Reação exotérmica ou gasosa no trato digestivo' : t === 'oxigenio' ? 'Espuma de oxigênio e distensão' : 'Contato com pH extremo'
    },
    {
      id: 'figado',
      nome: 'Fígado / Rins',
      nivel: paracetamol && alcool ? 2 : paracetamol ? 1 : 0,
      causa: paracetamol
        ? alcool ? 'Paracetamol potencializado pelo álcool' : 'Paracetamol em excesso'
        : 'Metabolismo hepático'
    },
    {
      id: 'coracao',
      nome: 'Coração',
      nivel: Math.max(severidade.indice === 0 ? 2 : severidade.indice === 1 ? 1 : 0, metanol ? 1 : 0),
      causa: severidade.indice === 0 ? 'Choque e acidose ou alcalose severa' : 'Distúrbio do equilíbrio ácido-base'
    }
  ];
}

function carregarPersonalizadas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE_PERSONALIZADAS) || '[]');
    return Array.isArray(salvas) ? salvas : [];
  } catch {
    return [];
  }
}

function salvarPersonalizadas(lista) {
  try {
    localStorage.setItem(CHAVE_PERSONALIZADAS, JSON.stringify(lista));
  } catch {
    // Sem acesso ao armazenamento: a substância continua disponível só nesta sessão
  }
}

function useLargura() {
  const [largura, setLargura] = useState(() => window.innerWidth);
  useEffect(() => {
    const aoRedimensionar = () => setLargura(window.innerWidth);
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, []);
  return largura;
}

function Becher({ volume, cor, reacao }) {
  const alturaLiquido = Math.min((volume / 1000) * 100, 90);
  const temFumaca = reacao.deltaT > 15 && reacao.gas;

  const bolhas = [
    { left: '12%', d: 5, dur: 1.8, atraso: 0 },
    { left: '28%', d: 8, dur: 2.3, atraso: 0.6 },
    { left: '45%', d: 4, dur: 1.5, atraso: 0.2 },
    { left: '60%', d: 7, dur: 2.0, atraso: 1.1 },
    { left: '75%', d: 5, dur: 1.7, atraso: 0.4 },
    { left: '88%', d: 9, dur: 2.5, atraso: 0.9 }
  ];

  const vapores = [
    { left: 22, d: 22, dur: 2.8, atraso: 0 },
    { left: 48, d: 30, dur: 3.2, atraso: 0.9 },
    { left: 74, d: 20, dur: 2.6, atraso: 1.6 }
  ];

  return (
    <div style={{ position: 'relative', width: 150, height: 200 }}>
      {/* Fumaça / vapor acima do béquer quando ΔT > 15 °C */}
      {temFumaca && vapores.map((v, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: v.left,
            width: v.d,
            height: v.d,
            borderRadius: '50%',
            background: reacao.gas,
            filter: 'blur(6px)',
            animation: `fumaca ${v.dur}s ease-out infinite`,
            animationDelay: `${v.atraso}s`
          }}
        />
      ))}

      {/* Vidro */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '3px solid #94a3b8',
        borderTop: 'none',
        borderRadius: '0 0 22px 22px',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.5)',
        boxShadow: 'inset 0 0 20px rgba(148, 163, 184, 0.15)'
      }}>
        {/* Líquido */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${alturaLiquido}%`,
          background: cor,
          opacity: 0.9,
          transition: 'height 0.7s ease, background-color 0.9s ease'
        }}>
          {/* Menisco */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255, 255, 255, 0.35)' }} />

          {/* Efervescência */}
          {reacao.bolhas && bolhas.map((b, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                bottom: 6,
                left: b.left,
                width: b.d,
                height: b.d,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.7)',
                animation: `bolhaSobe ${b.dur}s ease-in infinite`,
                animationDelay: `${b.atraso}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Graduação */}
      {[200, 400, 600, 800, 1000].map((ml) => (
        <div
          key={ml}
          style={{
            position: 'absolute',
            left: '100%',
            marginLeft: 6,
            bottom: `${ml / 10}%`,
            transform: 'translateY(50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ width: 10, height: 1, background: '#cbd5e1' }} />
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: CORES.textoSecundario }}>{ml}</span>
        </div>
      ))}
    </div>
  );
}

function Termometro({ temperatura, delta, percentual }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 18, height: 200 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9,
          background: '#0b1120',
          border: '2px solid #475569',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${percentual}%`,
            background: `linear-gradient(to top, ${CORES.amarelo}, ${CORES.vermelho})`,
            transition: 'height 0.7s ease'
          }} />
        </div>
        <div style={{
          position: 'absolute',
          bottom: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: CORES.vermelho,
          border: '2px solid #475569',
          boxShadow: `0 0 14px ${CORES.vermelho}88`
        }} />
      </div>
      <Thermometer size={16} color={CORES.amarelo} style={{ marginTop: 14 }} />
      <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{temperatura}°C</span>
      <span style={{ fontSize: 11, color: CORES.amarelo }}>+{delta}°C</span>
    </div>
  );
}

function IndicadorTempo({ severidade }) {
  const faixas = ['15 min', '1 h', '4 h'];
  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Clock size={14} color={CORES.textoSecundario} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: CORES.textoSecundario }}>
          Tempo útil para atendimento médico
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {faixas.map((f, i) => {
          const ativo = severidade.indice === i;
          const cor = i === 0 ? '#dc2626' : i === 1 ? CORES.laranja : '#ca8a04';
          return (
            <div key={f} style={{ textAlign: 'center' }}>
              <div style={{
                height: 8,
                borderRadius: 999,
                background: ativo ? cor : CORES.superficieAlt,
                boxShadow: ativo ? `0 0 12px ${cor}` : 'none',
                transition: 'all 0.4s ease'
              }} />
              <span style={{ display: 'block', marginTop: 6, fontSize: 11, fontFamily: 'monospace', color: ativo ? CORES.texto : CORES.textoSutil, fontWeight: ativo ? 700 : 400 }}>
                {f}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 13, fontWeight: 600, color: severidade.indice === -1 ? CORES.textoSecundario : CORES.texto }}>
        {severidade.tempo}
      </p>
    </div>
  );
}

function estiloOrgao(organo, ativo) {
  return {
    fill: organo.nivel === 2 ? CORES.vermelho : organo.nivel === 1 ? CORES.amarelo : '#334155',
    stroke: ativo ? '#ffffff' : 'transparent',
    strokeWidth: 2,
    animation: organo.nivel === 2
      ? 'piscaVermelho 1s ease-in-out infinite'
      : organo.nivel === 1
      ? 'piscaAmarelo 1.8s ease-in-out infinite'
      : 'none',
    transition: 'fill 0.4s ease'
  };
}

function Orgao({ organo, foco, onSelecionar, children }) {
  const rotulo = organo.nivel === 2 ? 'Risco crítico' : organo.nivel === 1 ? 'Atenção' : 'Sem risco';
  return (
    <g
      onClick={() => onSelecionar(organo.id)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`${organo.nome}: ${rotulo}`}
    >
      <title>{`${organo.nome}: ${rotulo}`}</title>
      {children(estiloOrgao(organo, organo.id === foco))}
    </g>
  );
}

function CorpoHumano({ organos, foco, onSelecionar }) {
  const org = (id) => organos.find((o) => o.id === id);

  return (
    <svg viewBox="-110 0 420 380" width="100%" style={{ maxWidth: 420, display: 'block', margin: '0 auto' }} role="img" aria-label="Diagrama do corpo humano">
      {/* Silhueta */}
      <g fill="#1e293b" stroke="#475569" strokeWidth="1.5">
        <circle cx="100" cy="36" r="26" />
        <path d="M 80 66 Q 100 72 120 66 L 150 92 L 132 230 L 68 230 L 50 92 Z" />
      </g>
      <g stroke="#334155" strokeWidth="14" strokeLinecap="round" fill="none">
        <path d="M 56 96 L 36 200" />
        <path d="M 144 96 L 164 200" />
        <path d="M 86 228 L 84 352" strokeWidth="18" />
        <path d="M 114 228 L 116 352" strokeWidth="18" />
      </g>

      {/* Órgãos clicáveis */}
      <Orgao organo={org('cerebro')} foco={foco} onSelecionar={onSelecionar}>
        {(estilo) => <ellipse cx="100" cy="32" rx="17" ry="12" style={estilo} />}
      </Orgao>

      <Orgao organo={org('boca')} foco={foco} onSelecionar={onSelecionar}>
        {(estilo) => (
          <g>
            <ellipse cx="100" cy="52" rx="8" ry="3.5" style={estilo} />
            <rect x="97" y="66" width="6" height="46" rx="3" style={estilo} />
          </g>
        )}
      </Orgao>

      <Orgao organo={org('coracao')} foco={foco} onSelecionar={onSelecionar}>
        {(estilo) => (
          <path d="M 88 100 C 84 92 74 96 76 104 C 78 112 88 118 88 122 C 88 118 98 112 100 104 C 102 96 92 92 88 100 Z" style={estilo} />
        )}
      </Orgao>

      <Orgao organo={org('estomago')} foco={foco} onSelecionar={onSelecionar}>
        {(estilo) => (
          <path d="M 110 142 C 124 134 138 140 134 152 C 132 162 118 166 112 160 C 106 154 104 146 110 142 Z" style={estilo} />
        )}
      </Orgao>

      <Orgao organo={org('figado')} foco={foco} onSelecionar={onSelecionar}>
        {(estilo) => (
          <g>
            <path d="M 70 140 C 84 132 100 138 102 150 C 102 162 90 172 76 168 C 66 164 62 146 70 140 Z" style={estilo} />
            <ellipse cx="84" cy="192" rx="7" ry="10" style={estilo} />
            <ellipse cx="116" cy="192" rx="7" ry="10" style={estilo} />
          </g>
        )}
      </Orgao>

      {/* Rótulos com linhas guia */}
      {ROTULOS_ORGAOS.map((r) => (
        <g key={r.id} onClick={() => onSelecionar(r.id)} style={{ cursor: 'pointer' }}>
          <line
            x1={r.lado === 'esquerda' ? -4 : 156}
            y1={r.y}
            x2={r.px}
            y2={r.py}
            stroke="#475569"
            strokeDasharray="2 3"
          />
          <text
            x={r.lado === 'esquerda' ? -8 : 160}
            y={r.y + 4}
            textAnchor={r.lado === 'esquerda' ? 'end' : 'start'}
            fontSize="11"
            fontWeight={foco.id === r.id ? 700 : 400}
            fill={foco.id === r.id ? '#f1f5f9' : '#94a3b8'}
          >
            {r.texto}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Botao({ onClick, cor, children, className }) {
  return (
    <button onClick={onClick} className={className} style={{ ...estilos.botao, background: cor }}>
      {children}
    </button>
  );
}

export default function App() {
  const largura = useLargura();
  const ehDesktop = largura >= 1024;

  const [personalizadas, setPersonalizadas] = useState(carregarPersonalizadas);
  const catalogo = useMemo(() => [...SUBSTANCIAS, ...personalizadas], [personalizadas]);

  const [selecionadas, setSelecionadas] = useState([SUBSTANCIAS[0], SUBSTANCIAS[2]]);
  const [volume, setVolume] = useState(250);
  const [abaAtiva, setAbaAtiva] = useState('lab');
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [orgaoSelecionado, setOrgaoSelecionado] = useState(null);

  const [novaSubstancia, setNovaSubstancia] = useState({
    nome: '', formula: '', categoria: 'Produtos Domésticos', ph: 7, cor: '#10b981', descricao: ''
  });

  useEffect(() => {
    salvarPersonalizadas(personalizadas);
  }, [personalizadas]);

  const adicionarSubstancia = (subst) => {
    if (selecionadas.length < 3 && !selecionadas.find((s) => s.id === subst.id)) {
      setSelecionadas([...selecionadas, subst]);
    }
  };

  const removerSubstancia = (id) => {
    setSelecionadas(selecionadas.filter((s) => s.id !== id));
  };

  const carregarMistura = (ids) => {
    setSelecionadas(ids.map((id) => catalogo.find((s) => s.id === id)).filter(Boolean));
  };

  const criarNovaSubstancia = (e) => {
    e.preventDefault();
    if (!novaSubstancia.nome.trim()) return;
    const phValor = Math.min(Math.max(parseFloat(novaSubstancia.ph) || 7, 0), 14);
    const criada = {
      nome: novaSubstancia.nome.trim(),
      formula: novaSubstancia.formula.trim() || '—',
      categoria: novaSubstancia.categoria,
      cor: novaSubstancia.cor,
      descricao: novaSubstancia.descricao.trim() || 'Substância cadastrada pelo usuário.',
      id: `custom_${Date.now()}`,
      tipo: 'custom',
      ph: phValor,
      personalizada: true
    };
    setPersonalizadas([...personalizadas, criada]);
    setNovaSubstancia({ nome: '', formula: '', categoria: 'Produtos Domésticos', ph: 7, cor: '#10b981', descricao: '' });
  };

  // Cálculos da mistura (substâncias sem pH, como o sódio metálico, ficam fora da média)
  const phs = selecionadas.filter((s) => s.ph !== null).map((s) => s.ph);
  const phNumero = phs.length > 0 ? phs.reduce((acc, p) => acc + p, 0) / phs.length : 7;
  const phMedio = phNumero.toFixed(1);

  const reacao = analisarReacao(selecionadas);
  const deltaTemp = reacao.deltaT;
  const temperaturaFinal = 25 + deltaTemp;
  const nivelTermometro = Math.min(Math.max(((temperaturaFinal - 20) / 60) * 100, 8), 100);

  const severidade = calcularSeveridade(selecionadas, reacao);
  const corSolucao = corDaSolucao(selecionadas, phNumero);
  const organos = avaliarOrgaos(selecionadas, reacao, severidade);

  const orgaoFoco = organos.find((o) => o.id === orgaoSelecionado)
    || [...organos].sort((a, b) => b.nivel - a.nivel)[0];
  const detalheFoco = orgaoFoco.nivel > 0 ? DETALHES_ORGAOS[orgaoFoco.id][orgaoFoco.nivel] : null;
  const orgaosEmRisco = organos.filter((o) => o.nivel > 0);

  // Busca e filtro do catálogo
  const termo = normalizar(busca.trim());
  const casaBusca = (s) => !termo || normalizar(s.nome).includes(termo) || normalizar(s.formula).includes(termo);
  const encontradas = catalogo.filter((s) => casaBusca(s) && (!filtroCategoria || s.categoria === filtroCategoria));
  const contagemPorFiltro = (valor) => catalogo.filter((s) => casaBusca(s) && (!valor || s.categoria === valor)).length;

  const abas = [
    { id: 'lab', nome: 'Laboratório', icone: FlaskConical, dica: 'Simulação do béquer e das reações' },
    { id: 'body', nome: 'Fisiologia', icone: Activity, dica: 'Órgãos afetados pela mistura atual' },
    { id: 'firstaid', nome: 'Primeiros Socorros', icone: ShieldAlert, dica: 'Condutas de emergência' },
    { id: 'report', nome: 'Relatório', icone: FileText, dica: 'Dossiê técnico da simulação' }
  ];

  const cartaoSubstancia = (subst) => {
    const selecionada = selecionadas.some((s) => s.id === subst.id);
    const cheio = selecionadas.length >= 3;
    const bloqueado = selecionada || cheio;
    return (
      <button
        key={subst.id}
        disabled={bloqueado}
        onClick={() => adicionarSubstancia(subst)}
        title={selecionada ? 'Já está na mistura' : cheio ? 'Mistura cheia (máximo de 3)' : subst.descricao}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: 12,
          borderRadius: 10,
          border: `1px solid ${selecionada ? CORES.borda : CORES.bordaForte}`,
          background: selecionada ? 'rgba(30, 41, 59, 0.4)' : CORES.superficieAlt,
          color: selecionada ? CORES.textoSutil : CORES.texto,
          cursor: bloqueado ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          opacity: selecionada ? 0.6 : 1
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            {subst.nome} <span style={{ color: CORES.textoSecundario, fontWeight: 400 }}>({subst.formula})</span>
            {subst.personalizada && (
              <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: CORES.cyan, border: `1px solid ${CORES.cyan}66`, borderRadius: 4, padding: '1px 4px' }}>
                PERSONALIZADA
              </span>
            )}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: CORES.textoSecundario }}>
            {subst.categoria} • pH {phTexto(subst.ph)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: CORES.textoSutil, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subst.descricao}
          </p>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: subst.cor, flexShrink: 0 }} />
        <Plus size={16} color={CORES.cyan} style={{ flexShrink: 0 }} />
      </button>
    );
  };

  return (
    <div style={estilos.pagina}>
      <style>{KEYFRAMES}</style>

      {/* Cabeçalho */}
      <header style={estilos.cabecalho} className="no-print">
        <div style={{ ...estilos.container, padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FlaskConical size={32} color={CORES.cyan} />
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                background: `linear-gradient(90deg, ${CORES.cyan}, ${CORES.azul})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ChemTox Engine
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: CORES.textoSecundario }}>
                Simulador de Misturas & Toxicologia Humana
              </p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 4, background: CORES.superficieAlt, padding: 4, borderRadius: 12, flexWrap: 'wrap' }}>
            {abas.map((aba) => {
              const Icone = aba.icone;
              const ativa = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  title={aba.dica}
                  style={{
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: ativa ? CORES.cyan : 'transparent',
                    color: ativa ? '#0f172a' : CORES.textoSecundario,
                    boxShadow: ativa ? `0 0 16px ${CORES.cyan}55` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icone size={16} /> {aba.nome}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main style={{
        ...estilos.container,
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: ehDesktop ? '380px 1fr' : '1fr',
        gap: 24,
        alignItems: 'start'
      }}>

        {/* Coluna esquerda: mistura, atalhos e catálogo */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="no-print">

          {/* Mistura atual */}
          <section style={estilos.cartao}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ ...estilos.tituloSecao, color: CORES.cyan }}>Mistura Atual ({selecionadas.length}/3)</h2>
              {selecionadas.length > 0 && (
                <button
                  onClick={() => setSelecionadas([])}
                  title="Esvaziar o béquer"
                  style={{ background: 'none', border: 'none', color: CORES.rosa, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 6 }}
                >
                  <RefreshCw size={12} /> Limpar
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {selecionadas.length === 0 ? (
                <p style={{ margin: 0, padding: 16, textAlign: 'center', fontSize: 12, fontStyle: 'italic', color: CORES.textoSutil, border: `1px dashed ${CORES.bordaForte}`, borderRadius: 10 }}>
                  Nenhuma substância selecionada. Escolha substâncias abaixo.
                </p>
              ) : (
                selecionadas.map((subst) => (
                  <div
                    key={subst.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 10,
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: `1px solid ${CORES.bordaForte}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: subst.cor, boxShadow: `0 0 8px ${subst.cor}` }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{subst.nome}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: CORES.textoSecundario }}>{subst.formula} • pH {phTexto(subst.ph)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerSubstancia(subst.id)}
                      aria-label={`Remover ${subst.nome}`}
                      title="Remover da mistura"
                      style={{ background: 'none', border: 'none', color: CORES.textoSecundario, cursor: 'pointer', fontSize: 16, padding: '4px 10px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ paddingTop: 14, borderTop: `1px solid ${CORES.borda}` }}>
              <label style={{ ...estilos.rotulo, display: 'block', marginBottom: 8 }}>
                Volume da Solução: <span style={{ color: CORES.cyan }}>{volume} ml</span>
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ width: '100%', accentColor: CORES.cyan, cursor: 'pointer' }}
              />
            </div>
          </section>

          {/* Misturas rápidas */}
          <section style={estilos.cartao}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <h2 style={estilos.tituloSecao}>Misturas Rápidas</h2>
              <span title="Atalhos para simular cenários prontos. Substitui a mistura atual." style={{ display: 'flex' }}>
                <Info size={14} color={CORES.textoSutil} />
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MISTURAS_RAPIDAS.map((m) => {
                const ativa = m.ids.length === selecionadas.length && m.ids.every((id) => selecionadas.some((s) => s.id === id));
                return (
                  <button
                    key={m.id}
                    onClick={() => carregarMistura(m.ids)}
                    title={`Carregar: ${m.nome} → ${m.efeito}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: 12,
                      borderRadius: 10,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: `1px solid ${ativa ? CORES.cyan : CORES.bordaForte}`,
                      background: ativa ? 'rgba(34, 211, 238, 0.1)' : CORES.superficieAlt,
                      color: CORES.texto,
                      boxShadow: ativa ? `0 0 14px ${CORES.cyan}44` : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{m.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{m.nome}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: CORES.textoSecundario }}>{m.efeito}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Catálogo com busca e filtros */}
          <section style={estilos.cartao}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={estilos.tituloSecao}>Catálogo</h2>
              <span style={{ fontSize: 11, color: CORES.textoSecundario }}>
                {encontradas.length} de {catalogo.length} substâncias
              </span>
            </div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} color={CORES.textoSutil} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="search"
                placeholder="Buscar por nome ou fórmula (ex: HCl, Acetona)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ ...estilos.input, paddingLeft: 32, paddingRight: busca ? 32 : 12 }}
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  aria-label="Limpar busca"
                  title="Limpar busca"
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: CORES.textoSecundario, cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {FILTROS.map((f) => {
                const ativo = filtroCategoria === f.valor;
                return (
                  <button
                    key={f.rotulo}
                    onClick={() => setFiltroCategoria(f.valor)}
                    style={{
                      border: `1px solid ${ativo ? CORES.cyan : CORES.bordaForte}`,
                      background: ativo ? 'rgba(34, 211, 238, 0.15)' : CORES.superficieAlt,
                      color: ativo ? CORES.cyan : CORES.textoSecundario,
                      borderRadius: 999,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {f.rotulo} <span style={{ opacity: 0.7 }}>({contagemPorFiltro(f.valor)})</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
              {encontradas.length === 0 ? (
                <p style={{ margin: 0, padding: 16, textAlign: 'center', fontSize: 12, color: CORES.textoSutil, border: `1px dashed ${CORES.bordaForte}`, borderRadius: 10 }}>
                  Nenhuma substância encontrada. Tente outro nome ou fórmula.
                </p>
              ) : (
                encontradas.map((subst) => cartaoSubstancia(subst))
              )}
            </div>
          </section>

          {/* Cadastro de nova substância */}
          <section style={estilos.cartao}>
            <h3 style={{ ...estilos.rotulo, marginBottom: 12 }}>Adicionar Nova Substância</h3>
            <form onSubmit={criarNovaSubstancia} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                placeholder="Nome (ex: Vinagre)"
                value={novaSubstancia.nome}
                onChange={(e) => setNovaSubstancia({ ...novaSubstancia, nome: e.target.value })}
                style={estilos.input}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Fórmula (ex: CH3COOH)"
                  value={novaSubstancia.formula}
                  onChange={(e) => setNovaSubstancia({ ...novaSubstancia, formula: e.target.value })}
                  style={estilos.input}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  placeholder="pH (0-14)"
                  value={novaSubstancia.ph}
                  onChange={(e) => setNovaSubstancia({ ...novaSubstancia, ph: e.target.value })}
                  style={estilos.input}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px', gap: 8 }}>
                <select
                  value={novaSubstancia.categoria}
                  onChange={(e) => setNovaSubstancia({ ...novaSubstancia, categoria: e.target.value })}
                  style={estilos.input}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="color"
                  value={novaSubstancia.cor}
                  onChange={(e) => setNovaSubstancia({ ...novaSubstancia, cor: e.target.value })}
                  title="Cor representativa"
                  style={{ ...estilos.input, padding: 4, height: 38 }}
                />
              </div>
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={novaSubstancia.descricao}
                onChange={(e) => setNovaSubstancia({ ...novaSubstancia, descricao: e.target.value })}
                style={estilos.input}
              />
              <button
                type="submit"
                style={{ ...estilos.botao, justifyContent: 'center', background: CORES.superficieAlt, border: `1px solid ${CORES.bordaForte}` }}
              >
                <Plus size={14} /> Cadastrar Substância
              </button>
            </form>
          </section>
        </aside>

        {/* Coluna direita: abas */}
        <section style={{ minWidth: 0 }}>

          {/* ABA 1: LABORATÓRIO VIRTUAL */}
          {abaAtiva === 'lab' && (
            <div style={estilos.cartao}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Laboratório de Misturas em Tempo Real</h2>
                <span
                  style={{
                    '--cor': severidade.cor,
                    background: severidade.cor,
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    animation: severidade.indice === 0
                      ? 'pulsoNeon 1s ease-in-out infinite'
                      : severidade.indice === 1
                      ? 'pulsoNeon 2s ease-in-out infinite'
                      : 'none'
                  }}
                >
                  {severidade.nivel}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: ehDesktop ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'center' }}>

                {/* Béquer + termômetro */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  gap: 40,
                  padding: 28,
                  paddingTop: 90,
                  background: CORES.fundo,
                  borderRadius: 14,
                  border: `1px solid ${CORES.borda}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Becher volume={volume} cor={corSolucao} reacao={reacao} />
                    <p style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: CORES.textoSecundario }}>
                      Béquer Graduado ({volume} ml)
                    </p>
                  </div>

                  <Termometro temperatura={temperaturaFinal} delta={deltaTemp} percentual={nivelTermometro} />
                </div>

                {/* Indicadores, tempo útil e equação */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>Temperatura</span>
                      <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}>{temperaturaFinal}°C (+{deltaTemp}°C)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>pH resultante estimado</span>
                      <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: CORES.cyan }}>{phMedio}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>Reação</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: deltaTemp > 15 ? CORES.laranja : CORES.texto, textAlign: 'right' }}>
                        {reacao.titulo}
                      </span>
                    </div>

                    {/* Escala de pH */}
                    <div>
                      <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7)' }}>
                        <div style={{
                          position: 'absolute',
                          top: -4,
                          left: `calc(${(phNumero / 14) * 100}% - 6px)`,
                          width: 12,
                          height: 18,
                          borderRadius: 4,
                          background: '#fff',
                          boxShadow: '0 0 8px #fff',
                          transition: 'left 0.5s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: CORES.textoSutil, marginTop: 6 }}>
                        <span>0 (ácido)</span><span>7</span><span>14 (base)</span>
                      </div>
                    </div>
                  </div>

                  <IndicadorTempo severidade={severidade} />

                  {/* Equação */}
                  <div style={{
                    background: CORES.fundo,
                    border: `1px solid ${CORES.cyan}55`,
                    borderRadius: 12,
                    padding: 16,
                    boxShadow: `0 0 20px ${CORES.cyan}22`
                  }}>
                    <p style={{ ...estilos.rotulo, color: CORES.cyan, marginBottom: 8 }}>Equação química resultante</p>
                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, lineHeight: 1.5, color: CORES.texto }}>
                      {reacao.equacao}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: FISIOLOGIA HUMANA */}
          {abaAtiva === 'body' && (
            <div style={estilos.cartao}>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={20} color={CORES.rosa} />
                Degradação Fisiológica e Progressão Toxicológica
              </h2>
              <p style={{ margin: '0 0 20px', fontSize: 12, color: CORES.textoSecundario }}>
                Clique em um órgão para ver os danos e o tempo estimado de complicação. Os órgãos em risco piscam.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: ehDesktop ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

                <div style={{ background: CORES.fundo, borderRadius: 14, border: `1px solid ${CORES.borda}`, padding: 16 }}>
                  <CorpoHumano organos={organos} foco={orgaoFoco.id} onSelecionar={setOrgaoSelecionado} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Detalhe do órgão em foco */}
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: `1px solid ${CORES.bordaForte}`,
                    borderLeft: `4px solid ${orgaoFoco.nivel === 2 ? CORES.vermelho : orgaoFoco.nivel === 1 ? CORES.amarelo : CORES.bordaForte}`,
                    borderRadius: 12,
                    padding: 18
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{orgaoFoco.nome}</h3>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 999,
                        color: orgaoFoco.nivel === 1 ? '#0f172a' : '#fff',
                        background: orgaoFoco.nivel === 2 ? CORES.vermelho : orgaoFoco.nivel === 1 ? CORES.amarelo : CORES.bordaForte
                      }}>
                        {orgaoFoco.nivel === 2 ? 'RISCO CRÍTICO' : orgaoFoco.nivel === 1 ? 'ATENÇÃO' : 'SEM RISCO'}
                      </span>
                    </div>

                    {detalheFoco ? (
                      <>
                        <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.6, color: CORES.texto }}>{detalheFoco.dano}</p>
                        <p style={{ margin: '10px 0 0', fontSize: 12, color: CORES.textoSecundario }}>
                          <strong style={{ color: CORES.textoSecundario }}>Causa:</strong> {orgaoFoco.causa}
                        </p>
                        <p style={{ margin: '10px 0 0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: CORES.amarelo, fontWeight: 600 }}>
                          <Clock size={14} /> Tempo estimado: {detalheFoco.tempo}
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: '12px 0 0', fontSize: 13, color: CORES.textoSecundario }}>
                        Nenhum dano previsto para este órgão com a mistura atual.
                      </p>
                    )}
                  </div>

                  {/* Lista de órgãos para toque direto */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {organos.map((o) => {
                      const ativo = o.id === orgaoFoco.id;
                      return (
                        <button
                          key={o.id}
                          onClick={() => setOrgaoSelecionado(o.id)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 14px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            border: `1px solid ${ativo ? CORES.cyan : CORES.bordaForte}`,
                            background: ativo ? 'rgba(34, 211, 238, 0.08)' : CORES.superficieAlt,
                            color: CORES.texto,
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          {o.nome}
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: o.nivel === 2 ? CORES.vermelho : o.nivel === 1 ? CORES.amarelo : '#334155',
                            boxShadow: o.nivel ? `0 0 8px ${o.nivel === 2 ? CORES.vermelho : CORES.amarelo}` : 'none'
                          }} />
                        </button>
                      );
                    })}
                  </div>

                  {orgaosEmRisco.length === 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: CORES.textoSutil }}>
                      Nenhum órgão em risco com a mistura atual.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: PRIMEIROS SOCORROS */}
          {abaAtiva === 'firstaid' && (
            <div style={{ ...estilos.cartao, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={20} color={CORES.amarelo} />
                Protocolo de Emergência e Atendimento Clínico
              </h2>

              <div style={{
                display: 'flex',
                gap: 14,
                padding: 18,
                borderRadius: 12,
                background: 'rgba(69, 10, 10, 0.6)',
                border: '1px solid #991b1b',
                boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
              }}>
                <AlertTriangle size={26} color={CORES.rosa} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fecaca' }}>CONTRAINDICAÇÃO GRAVE DE EMERGÊNCIA</h4>
                  <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#fca5a5' }}>
                    <strong>NUNCA INDUZA O VÔMITO</strong> em ingestões de corrosivos (ácidos/bases fortes). O refluxo do agente corrosivo provoca queimadura dupla no esôfago e vias aéreas.
                  </p>
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Ações de primeiros socorros recomendadas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Ligar imediatamente para o Serviço de Emergência / Centro de Assistência Toxicológica (CIT).',
                    'Manter as vias aéreas desobstruídas e posicionar a vítima de lado para evitar aspiração.',
                    'Não administrar leite ou neutralizantes caseiros sem indicação médica expressa.',
                    'Levar os recipientes das substâncias ingeridas ao hospital para identificação rápida.'
                  ].map((acao, i) => (
                    <div key={acao} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 10, background: CORES.superficieAlt, border: `1px solid ${CORES.bordaForte}` }}>
                      <span style={{
                        flexShrink: 0,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: CORES.cyan,
                        color: '#0f172a',
                        fontSize: 12,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {i + 1}
                      </span>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: CORES.texto }}>{acao}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: RELATÓRIO CLÍNICO */}
          {abaAtiva === 'report' && (
            <div style={{ ...estilos.cartao, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${CORES.borda}` }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Dossiê Toxicológico da Simulação</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: CORES.textoSecundario }}>Relatório técnico gerado pelo ChemTox Engine</p>
                </div>
                <Botao onClick={() => window.print()} cor={CORES.azul} className="no-print">
                  <Printer size={14} /> Imprimir Dossiê
                </Botao>
              </div>

              <div style={{
                background: CORES.fundo,
                padding: 18,
                borderRadius: 12,
                border: `1px solid ${CORES.borda}`,
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.8,
                color: CORES.textoSecundario,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[REAGENTES]:</strong> {selecionadas.map((s) => s.nome).join(' + ') || 'Nenhum'}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[VOLUME TOTAL]:</strong> {volume} ml</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[pH RESULTANTE]:</strong> {phMedio}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[REAÇÃO]:</strong> {reacao.titulo}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[AVALIAÇÃO DE RISCO]:</strong> {severidade.nivel}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[TEMPO ÚTIL]:</strong> {severidade.tempo}</p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: CORES.texto }}>[ÓRGÃOS EM RISCO]:</strong>{' '}
                  {orgaosEmRisco.length ? orgaosEmRisco.map((o) => `${o.nome} (${o.nivel === 2 ? 'crítico' : 'atenção'})`).join(', ') : 'Nenhum'}
                </p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[OBSERVAÇÕES CLÍNICAS]:</strong> Reação potencial severa em mucosas. Requer monitorização de pH sanguíneo e endoscopia digestiva alta precoce.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Rodapé */}
      <footer style={{ ...estilos.container, marginTop: 32, paddingTop: 16, borderTop: `1px solid ${CORES.borda}`, textAlign: 'center', fontSize: 12, color: CORES.textoSutil }} className="no-print">
        <p style={{ margin: 0 }}>
          ⚠️ <strong>Aviso Educacional:</strong> O ChemTox Engine é um simulador exclusivamente didático. Nunca realize misturas de produtos químicos reais nem consuma substâncias desconhecidas.
        </p>
      </footer>
    </div>
  );
}
