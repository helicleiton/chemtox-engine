import React, { useEffect, useMemo, useState } from 'react';
import {
  FlaskConical, AlertTriangle, ShieldAlert, Thermometer, Activity,
  FileText, Plus, RefreshCw, Printer, Filter, Clock, Info, Search, X
} from 'lucide-react';

// Modelo: "conc" é a concentração (mol/L) do reagente puro no frasco. Cada substância
// contribui com volume V/n na mistura. "acido"/"base" descrevem o comportamento ácido-base:
// forte (totalmente dissociado, com n equivalentes) ou fraco (pKa/pKb).
// "absorcao" = constantes ilustrativas (ka/ke em 1/h) para a curva plasmática.
const SUBSTANCIAS = [
  // Ácidos
  { id: 'h2so4', nome: 'Ácido Sulfúrico', formula: 'H₂SO₄', categoria: 'Ácidos', ph: 0.5, cor: '#ef4444', tipo: 'acid',
    conc: 1.0, acido: { forte: true, n: 2 },
    descricao: 'Ácido mineral forte, corrosivo e desidratante. Causa queimaduras profundas e reage com exotermia.' },
  { id: 'hcl', nome: 'Ácido Clorídrico (Muriático)', formula: 'HCl', categoria: 'Ácidos', ph: 0.8, cor: '#f87171', tipo: 'acid',
    conc: 1.0, acido: { forte: true, n: 1 }, volatil: true,
    descricao: 'Ácido mineral forte usado em limpeza de pisos. Libera vapores irritantes e corrói tecidos.' },
  { id: 'hno3', nome: 'Ácido Nítrico', formula: 'HNO₃', categoria: 'Ácidos', ph: 1.0, cor: '#facc15', tipo: 'acid',
    conc: 1.0, acido: { forte: true, n: 1 }, volatil: true,
    descricao: 'Ácido forte e oxidante. Causa queimaduras químicas e libera vapores nitrosos tóxicos.' },
  { id: 'vinagre', nome: 'Vinagre (Ácido Acético 5%)', formula: 'CH₃COOH', categoria: 'Ácidos', ph: 2.5, cor: '#fde68a', tipo: 'acid',
    conc: 0.8, acido: { pKa: 4.76, n: 1 },
    descricao: 'Ácido fraco de uso culinário. Em concentração doméstica causa irritação leve.' },
  { id: 'citrico', nome: 'Ácido Cítrico', formula: 'C₆H₈O₇', categoria: 'Ácidos', ph: 2.4, cor: '#fef08a', tipo: 'acid',
    conc: 0.05, acido: { pKa: 3.13, n: 1 },
    descricao: 'Ácido orgânico fraco presente em frutas cítricas e usado como acidulante alimentar.' },

  // Bases
  { id: 'naoh', nome: 'Soda Cáustica (Hidróxido de Sódio)', formula: 'NaOH', categoria: 'Bases', ph: 13.5, cor: '#3b82f6', tipo: 'base',
    conc: 1.0, base: { forte: true, n: 1, sal: true },
    descricao: 'Base forte e corrosiva. Saponifica tecidos e gera calor ao se dissolver em água.' },
  { id: 'amonia', nome: 'Amônia Doméstica', formula: 'NH₃', categoria: 'Bases', ph: 11.3, cor: '#60a5fa', tipo: 'base',
    conc: 0.5, base: { pKb: 4.75, n: 1, sal: false }, volatil: true,
    descricao: 'Base volátil de limpeza. Vapores irritam olhos e vias respiratórias.' },
  { id: 'bicarbonato', nome: 'Bicarbonato de Sódio', formula: 'NaHCO₃', categoria: 'Bases', ph: 8.3, cor: '#e0f2fe', tipo: 'base',
    conc: 0.5, base: { pKb: 7.65, n: 1, sal: true },
    descricao: 'Base fraca usada como fermento e antiácido. Com ácidos libera gás carbônico (CO₂).' },
  { id: 'cal', nome: 'Hidróxido de Cálcio (Cal Hidratada)', formula: 'Ca(OH)₂', categoria: 'Bases', ph: 12.4, cor: '#e2e8f0', tipo: 'base',
    conc: 0.02, base: { forte: true, n: 2, sal: true },
    descricao: 'Base pouco solúvel usada em construção. Pó e suspensão causam queimaduras nos olhos e pele.' },

  // Produtos domésticos
  { id: 'bleach', nome: 'Água Sanitária (Hipoclorito de Sódio)', formula: 'NaClO', categoria: 'Produtos Domésticos', ph: 11.5, cor: '#eab308', tipo: 'household', oxidante: true,
    conc: 0.5, base: { pKb: 6.5, n: 1, sal: true },
    descricao: 'Desinfetante oxidante. Nunca misturar com ácidos ou amônia: libera gases tóxicos.' },
  { id: 'detergente', nome: 'Detergente Neutro', formula: 'LAS (surfactante)', categoria: 'Produtos Domésticos', ph: 7.0, cor: '#86efac', tipo: 'surfactant', detergente: true,
    conc: 0,
    descricao: 'Surfactante de uso doméstico. Baixa toxicidade, mas causa irritação ocular.' },
  { id: 'desentupidor', nome: 'Desentupidor Enzimático', formula: 'Enzimas + NaOH', categoria: 'Produtos Domésticos', ph: 9.0, cor: '#a3e635', tipo: 'household',
    conc: 0.05, base: { forte: true, n: 1, sal: true },
    descricao: 'Mistura de enzimas e agentes alcalinos. Irritante para pele e olhos.' },
  { id: 'h2o2', nome: 'Água Oxigenada 10 volumes', formula: 'H₂O₂', categoria: 'Produtos Domésticos', ph: 4.5, cor: '#f0fdfa', tipo: 'peroxide', peroxido: true,
    conc: 0.3, acido: { pKa: 4.5, n: 1 },
    descricao: 'Agente oxidante de baixa concentração. Decompõe-se liberando oxigênio, o que pode formar espuma.' },
  { id: 'sabao', nome: 'Sabão Líquido', formula: 'RCOONa', categoria: 'Produtos Domésticos', ph: 10.0, cor: '#f9a8d4', tipo: 'soap',
    conc: 0.05, base: { pKb: 5.5, n: 1, sal: true },
    descricao: 'Sal alcalino de ácido graxo, usado na limpeza.' },
  { id: 'oleo', nome: 'Óleo Vegetal', formula: 'C₃H₅(OOCR)₃', categoria: 'Produtos Domésticos', ph: 7.0, cor: '#fcd34d', tipo: 'oil', aquoso: false,
    conc: 0,
    descricao: 'Triglicerídeos de origem vegetal, base da saponificação.' },

  // Medicamentos
  { id: 'paracetamol', nome: 'Paracetamol', formula: 'C₈H₉NO₂', categoria: 'Medicamentos', ph: 6.0, cor: '#a855f7', tipo: 'pharma',
    conc: 0.01, acido: { pKa: 9.5, n: 1 }, absorcao: { ka: 1.5, ke: 0.35 },
    descricao: 'Analgésico e antitérmico. Em excesso, causa lesão hepática, agravada pelo álcool.' },
  { id: 'aspirina', nome: 'Ácido Acetilsalicílico (Aspirina)', formula: 'C₉H₈O₄', categoria: 'Medicamentos', ph: 3.0, cor: '#c4b5fd', tipo: 'pharma',
    conc: 0.01, acido: { pKa: 3.5, n: 1 }, absorcao: { ka: 2.0, ke: 0.4 },
    descricao: 'Anti-inflamatório e antiagregante. Em excesso, causa irritação gástrica e acidose.' },
  { id: 'ibuprofeno', nome: 'Ibuprofeno', formula: 'C₁₃H₁₈O₂', categoria: 'Medicamentos', ph: 4.5, cor: '#ddd6fe', tipo: 'pharma',
    conc: 0.01, acido: { pKa: 4.4, n: 1 }, absorcao: { ka: 1.8, ke: 0.3 },
    descricao: 'Anti-inflamatório não esteroide. Em excesso, pode irritar a mucosa gástrica.' },
  { id: 'codeina', nome: 'Xarope com Codeína', formula: 'C₁₈H₂₁NO₃', categoria: 'Medicamentos', ph: 5.5, cor: '#8b5cf6', tipo: 'pharma', opioide: true,
    conc: 0.01, base: { pKb: 6.1, n: 1, sal: false }, absorcao: { ka: 1.2, ke: 0.25 },
    descricao: 'Antitussígeno opioide. Potencializa a depressão do SNC e respiratória quando combinado com álcool.' },

  // Solventes e orgânicos
  { id: 'alcohol', nome: 'Álcool Etílico 70%', formula: 'C₂H₅OH', categoria: 'Solventes', ph: 7.0, cor: '#06b6d4', tipo: 'solvent', etanol: true,
    conc: 0, absorcao: { ka: 2.0, ke: 0.15 },
    descricao: 'Solvente inflamável e depressor do SNC.' },
  { id: 'acetona', nome: 'Acetona', formula: 'C₃H₆O', categoria: 'Solventes', ph: 7.0, cor: '#67e8f9', tipo: 'solvent', aquoso: false,
    conc: 0,
    descricao: 'Solvente volátil e altamente inflamável. Vapores causam tontura e irritação das vias aéreas.' },
  { id: 'gasolina', nome: 'Gasolina (Hidrocarbonetos)', formula: 'C₄–C₁₂', categoria: 'Solventes', ph: 7.0, cor: '#fb923c', tipo: 'solvent', aquoso: false,
    conc: 0,
    descricao: 'Mistura de hidrocarbonetos inflamável. Aspiração pode causar pneumonia química.' },
  { id: 'metanol', nome: 'Metanol', formula: 'CH₃OH', categoria: 'Solventes', ph: 7.0, cor: '#22d3ee', tipo: 'solvent', metanol: true,
    conc: 0, absorcao: { ka: 1.0, ke: 0.1 },
    descricao: 'Álcool tóxico. Metabolizado em produtos que causam acidose metabólica e danos ao nervo óptico.' },

  // Bebidas alcoólicas e não alcoólicas (teor de etanol e acidez aproximados)
  { id: 'cerveja', nome: 'Cerveja (5% álcool)', formula: 'C₂H₅OH (5%)', categoria: 'Bebidas', ph: 4.3, cor: '#f59e0b', tipo: 'beverage', etanol: true,
    conc: 0.0001, acido: { pKa: 4.4, n: 1 }, absorcao: { ka: 1.5, ke: 0.15 },
    descricao: 'Bebida fermentada de baixo teor alcoólico. Contém etanol, que deprime o SNC e potencializa outras substâncias.' },
  { id: 'vinho_tinto', nome: 'Vinho Tinto (12% álcool)', formula: 'C₂H₅OH (12%)', categoria: 'Bebidas', ph: 3.6, cor: '#7f1d1d', tipo: 'beverage', etanol: true,
    conc: 0.0003, acido: { pKa: 3.5, n: 1 }, absorcao: { ka: 1.2, ke: 0.15 },
    descricao: 'Vinho de uva fermentada, ácido e com etanol. Efeito depressor do SNC proporcional à quantidade ingerida.' },
  { id: 'vinho_branco', nome: 'Vinho Branco (12% álcool)', formula: 'C₂H₅OH (12%)', categoria: 'Bebidas', ph: 3.2, cor: '#fef9c3', tipo: 'beverage', etanol: true,
    conc: 0.0008, acido: { pKa: 3.4, n: 1 }, absorcao: { ka: 1.2, ke: 0.15 },
    descricao: 'Vinho de uva branca, mais ácido que o tinto, com etanol.' },
  { id: 'cachaca', nome: 'Cachaça (40% álcool)', formula: 'C₂H₅OH (40%)', categoria: 'Bebidas', ph: 4.5, cor: '#e5e7eb', tipo: 'beverage', etanol: true,
    conc: 0.00005, acido: { pKa: 4.8, n: 1 }, absorcao: { ka: 2.0, ke: 0.15 },
    descricao: 'Destilado de cana-de-açúcar com alto teor alcoólico. Depressão do SNC e risco de intoxicação aguda.' },
  { id: 'whisky', nome: 'Uísque (40% álcool)', formula: 'C₂H₅OH (40%)', categoria: 'Bebidas', ph: 5.5, cor: '#b45309', tipo: 'beverage', etanol: true,
    conc: 0.00001, acido: { pKa: 5.5, n: 1 }, absorcao: { ka: 2.0, ke: 0.15 },
    descricao: 'Destilado de cereais envelhecido em barril, com alto teor alcoólico.' },
  { id: 'vodca', nome: 'Vodca (40% álcool)', formula: 'C₂H₅OH (40%)', categoria: 'Bebidas', ph: 6.0, cor: '#f8fafc', tipo: 'beverage', etanol: true,
    conc: 0.000001, acido: { pKa: 6.5, n: 1 }, absorcao: { ka: 2.0, ke: 0.15 },
    descricao: 'Destilado neutro com alto teor alcoólico. Depressão do SNC e risco de intoxicação aguda.' },
  { id: 'refrigerante', nome: 'Refrigerante de Cola', formula: 'H₃PO₄', categoria: 'Bebidas', ph: 2.5, cor: '#451a03', tipo: 'beverage',
    conc: 0.002, acido: { pKa: 2.15, n: 1 },
    descricao: 'Bebida gaseificada acidulada com ácido fosfórico. Não é cáustica, mas pode irritar o estômago e erodir o esmalte dentário.' },

  // Outros produtos diversos
  { id: 'cloro_piscina', nome: 'Cloro para Piscina (Hipoclorito de Cálcio)', formula: 'Ca(ClO)₂', categoria: 'Produtos Domésticos', ph: 11.0, cor: '#f1f5f9', tipo: 'household', oxidante: true,
    conc: 0.2, base: { pKb: 6.5, n: 2, sal: true },
    descricao: 'Oxidante sólido de tratamento de água. Nunca misturar com ácidos, amônia ou outros produtos.' },
  { id: 'agua_destilada', nome: 'Água Destilada', formula: 'H₂O', categoria: 'Produtos Domésticos', ph: 7.0, cor: '#e0f2fe', tipo: 'water',
    conc: 0,
    descricao: 'Água sem sais dissolvidos, usada em laboratório e em aparelhos. Atóxica.' },
  { id: 'acetato_etila', nome: 'Acetato de Etila (Removedor de Esmalte)', formula: 'CH₃COOC₂H₅', categoria: 'Solventes', ph: 7.0, cor: '#fef3c7', tipo: 'solvent', aquoso: false,
    conc: 0,
    descricao: 'Solvente volátil e inflamável. Vapores causam tontura e irritação das vias aéreas.' },
  { id: 'sulfato_magnesio', nome: 'Sulfato de Magnésio (Sal de Epsom)', formula: 'MgSO₄', categoria: 'Sais & Metais', ph: 6.5, cor: '#f8fafc', tipo: 'salt',
    conc: 0,
    descricao: 'Sal laxante de uso medicinal. Em excesso causa desidratação e distúrbios eletrolíticos.' },

  // Sais e metais
  { id: 'nacl', nome: 'Cloreto de Sódio (Sal de Cozinha)', formula: 'NaCl', categoria: 'Sais & Metais', ph: 7.0, cor: '#e2e8f0', tipo: 'salt',
    conc: 0,
    descricao: 'Sal neutro de uso alimentício.' },
  { id: 'cuso4', nome: 'Sulfato de Cobre', formula: 'CuSO₄', categoria: 'Sais & Metais', ph: 4.5, cor: '#2563eb', tipo: 'salt', cobre: true,
    conc: 0.1, acido: { pKa: 7.5, n: 1 },
    descricao: 'Sal azul tóxico se ingerido. Irrita pele e olhos e causa danos ao fígado e rins em excesso.' },
  { id: 'sodio', nome: 'Sódio Metálico', formula: 'Na', categoria: 'Sais & Metais', ph: null, cor: '#94a3b8', tipo: 'metal', aquoso: false,
    conc: 0,
    descricao: 'Metal alcalino extremamente reativo com água e umidade. Uso exclusivo em laboratório, com EPI.' }
];

const FILTROS = [
  { rotulo: 'Todos', valor: null },
  { rotulo: 'Ácidos', valor: 'Ácidos' },
  { rotulo: 'Bases', valor: 'Bases' },
  { rotulo: 'Domésticos', valor: 'Produtos Domésticos' },
  { rotulo: 'Medicamentos', valor: 'Medicamentos' },
  { rotulo: 'Bebidas', valor: 'Bebidas' },
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

// Constantes físico-químicas
const KW = 1e-14;
const R_ATM = 0.082057;        // L·atm/(mol·K)
const KSP_CU_OH2 = 2.2e-20;    // produto de solubilidade do Cu(OH)₂
const CP_AGUA = 4.18;          // J/(g·K)
const SODIO_MOL = 0.0435;      // amostra fixa de 1 g de sódio metálico
const VOL_ESTOMAGO_L = 1.0;    // volume gástrico estimado para pressão do gás

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

const ABAS = [
  { id: 'lab', nome: 'Laboratório', icone: FlaskConical, dica: 'Simulação do béquer e dos cálculos da reação' },
  { id: 'body', nome: 'Fisiologia', icone: Activity, dica: 'Órgãos afetados e curva plasmática' },
  { id: 'elementos', nome: 'Elementos', icone: FlaskConical, dica: 'Tabela periódica: combine elementos e veja a reação' },
  { id: 'exames', nome: 'Exames', icone: FileText, dica: 'Laudos simulados de gasometria, hemograma e função renal e hepática' },
  { id: 'firstaid', nome: 'Primeiros Socorros', icone: ShieldAlert, dica: 'Condutas de emergência e janelas de antídotos' },
  { id: 'report', nome: 'Relatório', icone: FileText, dica: 'Dossiê técnico da simulação' }
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
@keyframes faisca {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}
@keyframes chamaTremula {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(0.92, 1.12); }
}
@keyframes brilho {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
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

// Calcula a mistura: pH por balanço de cargas (pKa/pKb), reações com estequiometria,
// calor liberado (ΔH), variação de temperatura (ΔT = Q / m·c) e gases produzidos (n).
function calcularMistura(sel, volumeMl) {
  const Vl = Math.max(volumeMl, 1) / 1000;
  const Vi = sel.length ? Vl / sel.length : 0;

  const molPorId = {};
  let acidoForteEq = 0;
  let baseForteEq = 0;
  const acidosFracos = [];
  const basesNeutras = [];
  const basesSal = [];

  sel.forEach((s) => {
    const mol = (s.conc || 0) * Vi;
    molPorId[s.id] = mol;
    if (mol <= 0) return;
    if (s.acido) {
      if (s.acido.forte) acidoForteEq += mol * s.acido.n;
      else acidosFracos.push({ C: mol / Vl, Ka: 10 ** -s.acido.pKa });
    }
    if (s.base) {
      if (s.base.forte) baseForteEq += mol * s.base.n;
      else {
        const KaBH = 10 ** (s.base.pKb - 14);
        if (s.base.sal) basesSal.push({ C: mol / Vl, KaBH });
        else basesNeutras.push({ C: mol / Vl, KaBH });
      }
    }
  });

  const Ca = acidoForteEq / Vl;   // ânions de ácido forte
  const Cb = baseForteEq / Vl;    // cátions de base forte (Na⁺, Ca²⁺...)
  const cationsConst = Cb + basesSal.reduce((acc, b) => acc + b.C, 0);

  // Balanço de cargas: h + cátions = OH⁻ + ânions. Crescente em [H⁺], resolvido por bisseção em pH.
  const f = (h) =>
    h - KW / h +
    cationsConst +
    basesNeutras.reduce((acc, b) => acc + (b.C * h) / (h + b.KaBH), 0) -
    Ca -
    acidosFracos.reduce((acc, a) => acc + (a.C * a.Ka) / (a.Ka + h), 0) -
    basesSal.reduce((acc, b) => acc + (b.C * b.KaBH) / (h + b.KaBH), 0);

  let lo = 0;
  let hi = 14;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(10 ** -mid) > 0) lo = mid;
    else hi = mid;
  }
  const pH = (lo + hi) / 2;

  const m = (id) => molPorId[id] || 0;
  const acidoFracoMol = acidosFracos.reduce((acc, a) => acc + a.C * Vl, 0);
  const acidoTotal = acidoForteEq + acidoFracoMol;
  const acidoVolatil = sel.some((s) => s.volatil && s.acido && s.acido.forte);
  const temAmonia = m('amonia') > 0;

  const reacoes = [];

  // Sódio metálico: com água é explosivo; sem água, apenas reativo
  const temSodio = sel.some((s) => s.id === 'sodio');
  const sodioComAgua = sel.some((s) => s.id !== 'sodio' && s.aquoso !== false);
  if (temSodio && sodioComAgua) {
    reacoes.push({
      tipo: 'hidrogenio', titulo: 'Reação explosiva com água', fumaca: true, bolhas: true, gravidade: 0,
      equacao: '2Na + 2H₂O → 2NaOH + H₂↑ (Explosão e liberação de Hidrogênio)',
      deltaH: -184 * SODIO_MOL, gas: { nome: 'H₂', mol: SODIO_MOL / 2, cor: 'rgba(226, 232, 240, 0.45)' }
    });
  } else if (temSodio) {
    reacoes.push({
      tipo: 'metal', titulo: 'Metal reativo', fumaca: false, bolhas: false, gravidade: 1,
      equacao: 'Na + H₂O → NaOH + ½H₂↑ (reage com a umidade do ar e da pele)', deltaH: 0, gas: null
    });
  }

  // Cloro: hipoclorito + ácido. Consome hipoclorito antes da cloramina.
  const nBleach = m('bleach');
  let nBleachLivre = nBleach;
  if (nBleach > 0 && acidoTotal > 0) {
    const x = Math.min(nBleach, acidoTotal);
    nBleachLivre -= x;
    reacoes.push({
      tipo: 'cloro', titulo: 'Liberação de gás cloro', fumaca: true, bolhas: true, gravidade: 0,
      equacao: 'NaClO + H⁺ → HClO ⇌ Cl₂↑ + H₂O (Gás Cloro Tóxico)',
      deltaH: -90 * x, gas: { nome: 'Cl₂', mol: 0.5 * x, cor: 'rgba(190, 242, 100, 0.55)' }
    });
  }

  // Cloraminas: hipoclorito + amônia
  if (nBleachLivre > 0 && m('amonia') > 0) {
    const x = Math.min(nBleachLivre, m('amonia'));
    reacoes.push({
      tipo: 'cloramina', titulo: 'Formação de cloraminas', fumaca: true, bolhas: true, gravidade: 0,
      equacao: 'NH₃ + HOCl → NH₂Cl (Cloraminas, gás sufocante) + H₂O',
      deltaH: -50 * x, gas: { nome: 'NH₂Cl', mol: x, cor: 'rgba(217, 249, 157, 0.5)' }
    });
  }

  // Neutralização forte-forte
  const xNeut = Math.min(acidoForteEq, baseForteEq);
  if (xNeut > 0) {
    const gravidadeNeut = sel.some((s) => s.ph !== null && s.ph < 2) ? 0 : 1;
    reacoes.push({
      tipo: 'neutralizacao', titulo: 'Neutralização ácido-base', fumaca: false, bolhas: true, gravidade: gravidadeNeut,
      equacao: 'H⁺ + OH⁻ → H₂O + Calor (Neutralização Violenta)',
      deltaH: -57.3 * xNeut, gas: null
    });
  }

  // Ácido volátil + amônia: cloreto de amônio (fumaça branca)
  if (acidoVolatil && temAmonia) {
    const x = Math.min(acidoForteEq, m('amonia'));
    reacoes.push({
      tipo: 'nh4cl', titulo: 'Fumaça branca de cloreto de amônio', fumaca: true, bolhas: false, gravidade: 1,
      equacao: 'NH₃ + HCl → NH₄Cl (fumaça branca)',
      deltaH: -52 * x, gas: { nome: 'NH₄Cl', mol: 0, cor: 'rgba(255, 255, 255, 0.75)' }
    });
  }

  // Bicarbonato + ácido: CO₂ (absorve calor)
  if (m('bicarbonato') > 0 && acidoTotal > 0) {
    const x = Math.min(m('bicarbonato'), acidoTotal);
    reacoes.push({
      tipo: 'co2', titulo: 'Efervescência de CO₂', fumaca: false, bolhas: true, gravidade: 2,
      equacao: 'NaHCO₃ + H⁺ → Na⁺ + H₂O + CO₂↑',
      deltaH: 9 * x, gas: { nome: 'CO₂', mol: x, cor: null }
    });
  }

  // Peróxido + detergente: decomposição catalisada, com espuma de oxigênio
  if (m('h2o2') > 0 && sel.some((s) => s.detergente)) {
    const x = m('h2o2');
    reacoes.push({
      tipo: 'oxigenio', titulo: 'Efervescência de oxigênio', fumaca: false, bolhas: true, gravidade: 1,
      equacao: '2H₂O₂ → 2H₂O + O₂↑ (decomposição catalisada, com espuma)',
      deltaH: -98 * x, gas: { nome: 'O₂', mol: x / 2, cor: null }
    });
  }

  // Sabão + óleo: saponificação (sem liberação significativa de calor no modelo)
  if (sel.some((s) => s.tipo === 'soap') && sel.some((s) => s.tipo === 'oil')) {
    reacoes.push({
      tipo: 'saponificacao', titulo: 'Saponificação', fumaca: false, bolhas: false, gravidade: 2,
      equacao: 'Óleo (triglicerídeo) + Base → Sabão + Glicerol (Saponificação)', deltaH: 0, gas: null
    });
  }

  const primariaBase = reacoes.length
    ? [...reacoes].sort((a, b) => a.gravidade - b.gravidade)[0]
    : {
        tipo: 'nenhuma', titulo: 'Sem reação direta', fumaca: false, bolhas: false, gravidade: 2,
        equacao: 'Mistura em Solução Aquosa / Sem Reação Direta', deltaH: 0, gas: null
      };

  const dH = reacoes.reduce((acc, r) => acc + r.deltaH, 0);             // kJ
  // ΔH < 0 é exotérmico: o calor liberado (−ΔH) aquece a solução. Massa ≈ volume (g).
  const dT = volumeMl > 0 ? (-dH * 1000) / (volumeMl * CP_AGUA) : 0;
  const tFinal = 25 + dT;
  const gasMol = reacoes.reduce((acc, r) => acc + (r.gas ? r.gas.mol : 0), 0);

  // Precipitação de Cu(OH)₂: Q = [Cu²⁺]·[OH⁻]² comparado ao Ksp
  const nCu = m('cuso4');
  const h = 10 ** -pH;
  const oh = KW / h;
  const cuConc = nCu / Vl;
  const Q = cuConc * oh * oh;
  const precipFracao = nCu > 0 && Q > KSP_CU_OH2 ? Math.min(1, Math.log10(Q / KSP_CU_OH2) / 3) : 0;

  return {
    pH,
    Ca,
    Cb,
    acidoTotal,
    reacoes,
    primaria: { ...primariaBase, deltaT: dT, cor: primariaBase.gas ? primariaBase.gas.cor : null },
    dH,
    dT,
    tFinal,
    gasMol,
    precip: { fracao: precipFracao, Q, ksp: KSP_CU_OH2 }
  };
}

function calcularSeveridade(sel, mix) {
  if (sel.length === 0) {
    return { nivel: 'SEM MISTURA', cor: '#475569', tempo: 'Sem risco imediato', indice: -1 };
  }
  // Alto risco só para pH muito extremo; ácidos fracos (vinagre, refrigerante) ficam como moderados
  const porNominal = sel.some((s) => s.ph !== null && (s.ph < 2 || s.ph > 11)) || mix.pH < 2.2 || mix.pH > 11;
  const indice = Math.min(mix.primaria.gravidade, porNominal ? 1 : 2);
  if (indice === 0) {
    return { nivel: 'FATAL / CRÍTICO', cor: '#dc2626', tempo: 'Crítico: primeiros 15 minutos', indice };
  }
  if (indice === 1) {
    return { nivel: 'ALTO RISCO', cor: CORES.laranja, tempo: 'Urgente: até 1 hora', indice };
  }
  return { nivel: 'MODERADO / BAIXO', cor: '#ca8a04', tempo: 'Observação: até 4 horas', indice };
}

// Corrosividade pela escala de Zargar (ingestão de cáusticos), pelo pH da mistura
function avaliarCorrosividade(sel, mix) {
  const ext = Math.max(0, 7 - mix.pH, mix.pH - 7);
  const nominal = sel.some((s) => s.ph !== null && (s.ph < 2 || s.ph > 11));
  // Só ácidos/bases fortes em pH extremo são cáusticos; ácidos fracos (aspirina, vinagre) não.
  const corrosivo = mix.pH < 2.5 || mix.pH > 11.5 || nominal;
  let grau = null;
  if (corrosivo) {
    grau = ext >= 6 ? 'IIIb' : ext >= 5 ? 'IIIa' : ext >= 4 ? 'IIb' : ext >= 3 ? 'IIa' : 'I';
  }
  const perfuracao = { IIIb: 40, IIIa: 20, IIb: 5, IIa: 1, I: 0 }[grau] || 0;
  const edemaBase = { IIIb: 60, IIIa: 40, IIb: 20, IIa: 8, I: 2 }[grau] || 0;
  return { corrosivo, grau, perfuracao, edemaBase };
}

// Nível de dano de cada órgão: 0 = sem risco, 1 = atenção, 2 = crítico
function avaliarOrgaos(sel, mix, sev) {
  const tipos = mix.reacoes.map((r) => r.tipo);
  const tem = (t) => tipos.includes(t);
  const gasTox = tem('cloro') || tem('cloramina');
  const reagiu = ['cloro', 'cloramina', 'neutralizacao', 'hidrogenio', 'co2', 'nh4cl'].some(tem);
  const corr = avaliarCorrosividade(sel, mix);
  const extremo = sel.some((s) => s.ph !== null && (s.ph < 3 || s.ph > 10)) || mix.pH < 3 || mix.pH > 10;
  const paracetamol = sel.some((s) => s.id === 'paracetamol');
  const alcool = sel.some((s) => s.etanol);
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
      nivel: corr.corrosivo || gasTox || tem('hidrogenio') ? 2 : extremo || tem('oxigenio') ? 1 : 0,
      causa: corr.corrosivo ? 'Agente corrosivo ácido ou base' : gasTox ? 'Vapores tóxicos' : tem('hidrogenio') ? 'Projeção de álcali' : 'Contato com pH extremo'
    },
    {
      id: 'estomago',
      nome: 'Estômago',
      nivel: reagiu || corr.corrosivo ? 2 : extremo || tem('oxigenio') ? 1 : 0,
      causa: reagiu ? 'Reação exotérmica ou gasosa no trato digestivo' : tem('oxigenio') ? 'Espuma de oxigênio e distensão' : 'Contato com pH extremo'
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
      nivel: Math.max(sev.indice === 0 ? 2 : sev.indice === 1 ? 1 : 0, metanol ? 1 : 0),
      causa: sev.indice === 0 ? 'Choque e acidose ou alcalose severa' : 'Distúrbio do equilíbrio ácido-base'
    }
  ];
}

// Indicadores clínicos simulados, derivados da mistura e dos órgãos
function calcularMetricas(sel, mix, sev, organos) {
  const corr = avaliarCorrosividade(sel, mix);
  const tipos = mix.reacoes.map((r) => r.tipo);
  const gasTox = tipos.includes('cloro') || tipos.includes('cloramina');
  const alcool = sel.some((s) => s.etanol);
  const opioide = sel.some((s) => s.opioide);
  const metanol = sel.some((s) => s.metanol);
  const nivelF = organos.find((o) => o.id === 'figado').nivel;

  const broncoespasmo = gasTox ? Math.round(30 + 65 * (1 - Math.exp(-mix.gasMol / 0.01))) : 0;
  const edemaGlote = Math.min(95, corr.edemaBase + (gasTox ? 15 : 0));

  // Hepático e renal (ilustrativos)
  const alt = 25 + (nivelF === 2 ? 1500 : nivelF === 1 ? 60 : 0);
  const ast = Math.round(alt * 1.3) + 5;
  const gsh = nivelF === 2 ? 15 : nivelF === 1 ? 60 : 100;
  const inr = (1.0 + (nivelF === 2 ? 0.6 : nivelF === 1 ? 0.1 : 0)).toFixed(2);
  const tfg = 100 - (nivelF === 2 ? 50 : nivelF === 1 ? 10 : 0) - (metanol ? 15 : 0);
  const creat = (0.9 * (100 / tfg)).toFixed(1);
  const ureia = Math.round(30 + (100 - tfg) * 0.8);

  // Gasometria: acidemia ou alcalemia proporcional à gravidade
  const fac = sev.indice === 0 ? 1 : sev.indice === 1 ? 0.5 : sev.indice === 2 ? 0.2 : 0;
  const direcao = mix.pH < 7 ? -1 : mix.pH > 7 ? 1 : 0;
  let delta = direcao * 0.12 * fac;
  if (metanol) delta -= 0.08;
  if (opioide && alcool) delta -= 0.05;
  const phSangue = +(7.4 + delta).toFixed(2);
  const hco3 = Math.max(4, Math.round(24 + 60 * (phSangue - 7.4)));
  const pco2 = 40 + (opioide && alcool ? 15 : 0) + (gasTox ? 5 : 0);
  const ag = 12 + (metanol ? 16 : 0) + (phSangue < 7.35 && !metanol ? 4 : 0);

  return {
    corrosivo: corr.corrosivo,
    grauZargar: corr.grau,
    perfuracao: corr.perfuracao,
    broncoespasmo,
    edemaGlote,
    alt,
    ast,
    gsh,
    inr,
    tfg,
    creat,
    ureia,
    phSangue,
    hco3,
    pco2,
    ag,
    leucocitos: 7000 + (corr.corrosivo ? 4000 : 0),
    hb: (14.0 - (gasTox ? 0.4 : 0)).toFixed(1),
    plaquetas: 250000
  };
}

// Antídotos e condutas com janela de tempo (minutos após a exposição)
function listarAntidotos(sel, metricas, mix) {
  const lista = [];
  const tipos = mix.reacoes.map((r) => r.tipo);
  if (sel.some((s) => s.id === 'paracetamol')) {
    lista.push({ nome: 'N-acetilcisteína (NAC)', motivo: 'Paracetamol', janelaMin: 480, nota: 'Mais eficaz nas primeiras 8 h após a exposição.' });
  }
  if (sel.some((s) => s.opioide)) {
    lista.push({ nome: 'Naloxona', motivo: 'Opioide (codeína)', janelaMin: 10, nota: 'Efeito em minutos. Monitorar a respiração continuamente.' });
  }
  if (sel.some((s) => s.metanol)) {
    lista.push({ nome: 'Fomepizol', motivo: 'Metanol', janelaMin: 480, nota: 'Quanto antes, melhor. Idealmente nas primeiras 8 h.' });
  }
  if (metricas.corrosivo) {
    lista.push({ nome: 'Endoscopia digestiva alta', motivo: 'Corrosivo (sem antídoto específico)', janelaMin: 720, nota: 'Realizar precocemente, em até 12 a 24 h.' });
  }
  if (tipos.includes('cloro') || tipos.includes('cloramina')) {
    lista.push({ nome: 'Oxigênio e suporte ventilatório', motivo: 'Gás tóxico', janelaMin: 0, nota: 'Sem janela: tratar imediatamente.' });
  }
  return lista;
}

// Curva plasmática ilustrativa (Bateman), normalizada pelo pico; não depende de dose
function curvasPlasma(sel) {
  return sel
    .filter((s) => s.absorcao)
    .map((s) => {
      const { ka, ke } = s.absorcao;
      const tmax = Math.log(ka / ke) / (ka - ke);
      const pontos = [];
      for (let i = 0; i <= 60; i++) {
        const t = (i * 8) / 60;
        pontos.push((ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t)));
      }
      const pico = Math.max(...pontos);
      return { id: s.id, nome: s.nome, cor: s.cor, tmax, pontos: pontos.map((v) => v / pico) };
    });
}

function flag(valor, min, max) {
  const v = Number(valor);
  if (v < min) return '↓';
  if (v > max) return '↑';
  return '';
}

function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(ss).padStart(2, '0')}s`;
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

// ─────────────── Tabela periódica: elementos e reações entre eles ───────────────

const GRUPOS_ELEMENTOS = {
  alcalino: { nome: 'Metais alcalinos', cor: '#f97316' },
  alcalinoterroso: { nome: 'Metais alcalinoterrosos', cor: '#eab308' },
  transicao: { nome: 'Metais de transição', cor: '#38bdf8' },
  metalPos: { nome: 'Outros metais', cor: '#94a3b8' },
  naoMetal: { nome: 'Não-metais', cor: '#22c55e' },
  halogenio: { nome: 'Halogênios', cor: '#a3e635' },
  nobre: { nome: 'Gases nobres', cor: '#a855f7' }
};

// Eletronegatividade de Pauling (null = sem valor relevante para gases nobres)
const ELEMENTOS_TP = [
  { s: 'H', nome: 'Hidrogênio', z: 1, m: 1.008, g: 'naoMetal', chi: 2.20, r: 1, c: 1 },
  { s: 'He', nome: 'Hélio', z: 2, m: 4.003, g: 'nobre', chi: null, r: 1, c: 18 },
  { s: 'Li', nome: 'Lítio', z: 3, m: 6.94, g: 'alcalino', chi: 0.98, r: 2, c: 1 },
  { s: 'C', nome: 'Carbono', z: 6, m: 12.011, g: 'naoMetal', chi: 2.55, r: 2, c: 14 },
  { s: 'N', nome: 'Nitrogênio', z: 7, m: 14.007, g: 'naoMetal', chi: 3.04, r: 2, c: 15 },
  { s: 'O', nome: 'Oxigênio', z: 8, m: 15.999, g: 'naoMetal', chi: 3.44, r: 2, c: 16 },
  { s: 'F', nome: 'Flúor', z: 9, m: 18.998, g: 'halogenio', chi: 3.98, r: 2, c: 17 },
  { s: 'Ne', nome: 'Neônio', z: 10, m: 20.180, g: 'nobre', chi: null, r: 2, c: 18 },
  { s: 'Na', nome: 'Sódio', z: 11, m: 22.990, g: 'alcalino', chi: 0.93, r: 3, c: 1 },
  { s: 'Mg', nome: 'Magnésio', z: 12, m: 24.305, g: 'alcalinoterroso', chi: 1.31, r: 3, c: 2 },
  { s: 'Al', nome: 'Alumínio', z: 13, m: 26.982, g: 'metalPos', chi: 1.61, r: 3, c: 13 },
  { s: 'Si', nome: 'Silício', z: 14, m: 28.085, g: 'naoMetal', chi: 1.90, r: 3, c: 14 },
  { s: 'P', nome: 'Fósforo', z: 15, m: 30.974, g: 'naoMetal', chi: 2.19, r: 3, c: 15 },
  { s: 'S', nome: 'Enxofre', z: 16, m: 32.06, g: 'naoMetal', chi: 2.58, r: 3, c: 16 },
  { s: 'Cl', nome: 'Cloro', z: 17, m: 35.45, g: 'halogenio', chi: 3.16, r: 3, c: 17 },
  { s: 'Ar', nome: 'Argônio', z: 18, m: 39.948, g: 'nobre', chi: null, r: 3, c: 18 },
  { s: 'K', nome: 'Potássio', z: 19, m: 39.098, g: 'alcalino', chi: 0.82, r: 4, c: 1 },
  { s: 'Ca', nome: 'Cálcio', z: 20, m: 40.078, g: 'alcalinoterroso', chi: 1.00, r: 4, c: 2 },
  { s: 'Fe', nome: 'Ferro', z: 26, m: 55.845, g: 'transicao', chi: 1.83, r: 4, c: 8 },
  { s: 'Cu', nome: 'Cobre', z: 29, m: 63.546, g: 'transicao', chi: 1.90, r: 4, c: 11 },
  { s: 'Zn', nome: 'Zinco', z: 30, m: 65.38, g: 'transicao', chi: 1.65, r: 4, c: 12 },
  { s: 'Br', nome: 'Bromo', z: 35, m: 79.904, g: 'halogenio', chi: 2.96, r: 4, c: 17 },
  { s: 'Ag', nome: 'Prata', z: 47, m: 107.87, g: 'transicao', chi: 1.93, r: 5, c: 11 },
  { s: 'I', nome: 'Iodo', z: 53, m: 126.90, g: 'halogenio', chi: 2.66, r: 5, c: 17 },
  { s: 'Au', nome: 'Ouro', z: 79, m: 196.97, g: 'transicao', chi: 2.54, r: 6, c: 11 },
  { s: 'Hg', nome: 'Mercúrio', z: 80, m: 200.59, g: 'transicao', chi: 2.00, r: 6, c: 12 }
];

const COMPOSTOS_TP = [
  { s: 'H2O', formula: 'H₂O', nome: 'Água' },
  { s: 'HCl', formula: 'HCl', nome: 'Ácido clorídrico' }
];

const TIPO_LABEL = {
  sintese: 'Síntese / adição',
  deslocamento: 'Deslocamento simples',
  explosiva: 'Reação explosiva / combustão violenta',
  oxidacao: 'Formação de óxido / oxidação',
  semreacao: 'Sem reação (série de reatividade)',
  sem_reacao: 'Sem reação prevista',
  inerte: 'Mistura inerte / sem reação'
};

const ESTADO_LABEL = { s: 'sólido', l: 'líquido', g: 'gás', aq: 'solução aquosa' };

const GAS_COR = {
  H2: 'rgba(226, 232, 240, 0.35)',
  Cl2: 'rgba(190, 242, 100, 0.55)',
  CO2: 'rgba(226, 232, 240, 0.4)',
  SO2: 'rgba(226, 232, 240, 0.5)',
  HCl: 'rgba(255, 255, 255, 0.7)'
};

const PRODUTOS_RISCO = {
  'NaOH': 'Base cáustica: queima pele e olhos e reage violentamente com ácidos.',
  'KOH': 'Base cáustica: queima pele e olhos.',
  'LiOH': 'Base cáustica: irrita e queima tecidos.',
  'Ca(OH)₂': 'Base irritante; o pó causa queimaduras nos olhos.',
  'H₂': 'Gás inflamável e explosivo quando misturado ao ar; asfixiante em locais fechados.',
  'H₂O': 'Sem risco relevante.',
  'HCl': 'Gás e solução corrosivos; vapores irritam vias respiratórias.',
  'NaCl': 'Sal de cozinha; baixo risco.',
  'KCl': 'Sal; baixo risco em pequenas quantidades.',
  'MgCl₂': 'Sal higroscópico; irritação leve.',
  'CaCl₂': 'Sal higroscópico; irritação leve dos olhos.',
  'AlCl₃': 'Corrosivo; hidrolisa e libera HCl.',
  'ZnCl₂': 'Irritante para pele e olhos; tóxico se ingerido.',
  'FeCl₂': 'Corrosivo e irritante.',
  'FeCl₃': 'Corrosivo e irritante.',
  'CuCl₂': 'Tóxico se ingerido; irritante.',
  'Na₂O': 'Reage com água formando NaOH cáustico.',
  'K₂O': 'Reage com água formando KOH cáustico.',
  'Li₂O': 'Reage com água formando LiOH cáustico.',
  'MgO': 'Pó irritante. A queima do magnésio produz luz intensa: não olhe diretamente.',
  'Al₂O₃': 'Praticamente inerte; o pó pode irritar.',
  'Fe₂O₃': 'Pouco tóxico (ferrugem).',
  'CuO': 'Irritante se inalado.',
  'FeS': 'Com ácidos libera H₂S, gás tóxico com odor de ovo podre.',
  'CO₂': 'Asfixiante em ambientes fechados.',
  'SO₂': 'Gás irritante e tóxico para as vias respiratórias.'
};

// Reações modeladas. "chaves" são os elementos/compostos necessários; "g" é a gravidade
// (0 = fatal, 1 = alta, 2 = moderada). "dH" são valores de referência aproximados (kJ por equação).
const REACOES_TP = [
  { id: 'na_agua', tipo: 'explosiva', chaves: ['Na', 'H2O'], eq: '2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)', dH: -368, g: 0, visual: 'faiscas', gas: 'H2', solido: null, aq: true, liga: ['Na', 'O'],
    explica: 'O sódio tem baixa eletronegatividade (0,93) e perde facilmente seu elétron de valência. A água é reduzida a H₂, e o calor da reação pode inflamar o gás.' },
  { id: 'k_agua', tipo: 'explosiva', chaves: ['K', 'H2O'], eq: '2K(s) + 2H₂O(l) → 2KOH(aq) + H₂(g)', dH: -393, g: 0, visual: 'faiscas', gas: 'H2', solido: null, aq: true, liga: ['K', 'O'],
    explica: 'O potássio é ainda mais reativo que o sódio. O calor liberado inflama o H₂ quase imediatamente.' },
  { id: 'li_agua', tipo: 'explosiva', chaves: ['Li', 'H2O'], eq: '2Li(s) + 2H₂O(l) → 2LiOH(aq) + H₂(g)', dH: -403, g: 1, visual: 'faiscas', gas: 'H2', solido: null, aq: true, liga: ['Li', 'O'],
    explica: 'O lítio reage com a água de forma vigorosa, porém menos violenta que os outros alcalinos.' },
  { id: 'ca_agua', tipo: 'deslocamento', chaves: ['Ca', 'H2O'], eq: 'Ca(s) + 2H₂O(l) → Ca(OH)₂(aq) + H₂(g)', dH: -414, g: 1, visual: null, gas: 'H2', solido: null, aq: true, liga: ['Ca', 'O'],
    explica: 'O cálcio desloca o hidrogênio da água, formando hidróxido de cálcio e liberando H₂ em borbulhamento.' },
  { id: 'h2_o2', tipo: 'explosiva', chaves: ['H', 'O'], eq: '2H₂(g) + O₂(g) → 2H₂O(l)', dH: -572, g: 0, visual: 'faiscas', gas: null, solido: null, aq: false, liga: ['H', 'O'],
    explica: 'Combustão do hidrogênio: a ligação O=O e as ligações H–H são rompidas e ligações O–H, mais fortes, se formam, liberando muita energia. A mistura explode com faísca.' },
  { id: 'h2_cl2', tipo: 'sintese', chaves: ['H', 'Cl'], eq: 'H₂(g) + Cl₂(g) → 2HCl(g)', dH: -185, g: 0, visual: 'faiscas', gas: 'HCl', solido: null, aq: false, liga: ['H', 'Cl'],
    explica: 'Síntese explosiva sob luz ou faísca. O HCl formado é um gás de ligação covalente polar, que forma névoa branca ao encontrar a umidade do ar.' },
  { id: 'na_cl2', tipo: 'sintese', chaves: ['Na', 'Cl'], eq: '2Na(s) + Cl₂(g) → 2NaCl(s)', dH: -822, g: 0, visual: 'faiscas', gas: null, solido: '#f8fafc', aq: false, liga: ['Na', 'Cl'],
    explica: 'Diferença grande de eletronegatividade (Δχ ≈ 2,2): o sódio cede um elétron ao cloro, formando íons Na⁺ e Cl⁻ que se organizam em um cristal iônico.' },
  { id: 'k_cl2', tipo: 'sintese', chaves: ['K', 'Cl'], eq: '2K(s) + Cl₂(g) → 2KCl(s)', dH: -873, g: 0, visual: 'faiscas', gas: null, solido: '#f8fafc', aq: false, liga: ['K', 'Cl'],
    explica: 'Síntese iônica muito exotérmica. O potássio cede seu elétron de valência ao cloro.' },
  { id: 'mg_cl2', tipo: 'sintese', chaves: ['Mg', 'Cl'], eq: 'Mg(s) + Cl₂(g) → MgCl₂(s)', dH: -641, g: 1, visual: 'brilho', gas: null, solido: '#f8fafc', aq: false, liga: ['Mg', 'Cl'],
    explica: 'O magnésio cede dois elétrons, formando Mg²⁺ e dois Cl⁻: ligação iônica.' },
  { id: 'fe_cl2', tipo: 'sintese', chaves: ['Fe', 'Cl'], eq: '2Fe(s) + 3Cl₂(g) → 2FeCl₃(s)', dH: -800, g: 1, visual: null, gas: null, solido: '#a16207', aq: false, liga: ['Fe', 'Cl'],
    explica: 'O ferro reage com o cloro formando cloreto férrico, um sólido de ligação predominantemente iônica.' },
  { id: 'cu_cl2', tipo: 'sintese', chaves: ['Cu', 'Cl'], eq: 'Cu(s) + Cl₂(g) → CuCl₂(s)', dH: -220, g: 2, visual: null, gas: null, solido: '#15803d', aq: false, liga: ['Cu', 'Cl'],
    explica: 'O cobre é oxidado pelo cloro a Cu²⁺, formando um sólido iônico.' },
  { id: 'na_o2', tipo: 'oxidacao', chaves: ['Na', 'O'], eq: '4Na(s) + O₂(g) → 2Na₂O(s)', dH: -829, g: 0, visual: 'chama', gas: null, solido: '#e5e7eb', aq: false, liga: ['Na', 'O'],
    explica: 'Oxidação vigorosa do sódio ao ar. O óxido de sódio formado reage com a umidade e produz NaOH cáustico.' },
  { id: 'k_o2', tipo: 'oxidacao', chaves: ['K', 'O'], eq: '4K(s) + O₂(g) → 2K₂O(s)', dH: -726, g: 0, visual: 'chama', gas: null, solido: '#e5e7eb', aq: false, liga: ['K', 'O'],
    explica: 'O potássio se oxida rapidamente ao ar, com chama, formando um óxido iônico.' },
  { id: 'li_o2', tipo: 'oxidacao', chaves: ['Li', 'O'], eq: '4Li(s) + O₂(g) → 2Li₂O(s)', dH: -1196, g: 1, visual: 'chama', gas: null, solido: '#e5e7eb', aq: false, liga: ['Li', 'O'],
    explica: 'Oxidação do lítio com chama. O óxido formado é iônico.' },
  { id: 'mg_o2', tipo: 'oxidacao', chaves: ['Mg', 'O'], eq: '2Mg(s) + O₂(g) → 2MgO(s)', dH: -1203, g: 1, visual: 'brilho', gas: null, solido: '#f8fafc', aq: false, liga: ['Mg', 'O'],
    explica: 'A queima do magnésio é muito intensa, com luz branca brilhante. O MgO é um sólido iônico, com Mg²⁺ e O²⁻.' },
  { id: 'al_o2', tipo: 'oxidacao', chaves: ['Al', 'O'], eq: '4Al(s) + 3O₂(g) → 2Al₂O₃(s)', dH: -3351, g: 2, visual: 'brilho', gas: null, solido: '#e5e7eb', aq: false, liga: ['Al', 'O'],
    explica: 'O alumínio forma uma camada protetora de Al₂O₃. Em pó finamente dividido, a reação é intensa.' },
  { id: 'c_o2', tipo: 'oxidacao', chaves: ['C', 'O'], eq: 'C(s) + O₂(g) → CO₂(g)', dH: -394, g: 2, visual: 'chama', gas: 'CO2', solido: null, aq: false, liga: ['C', 'O'],
    explica: 'Combustão completa do carbono. O CO₂ é um gás molecular com ligações covalentes polares C=O.' },
  { id: 's_o2', tipo: 'oxidacao', chaves: ['S', 'O'], eq: 'S(s) + O₂(g) → SO₂(g)', dH: -297, g: 1, visual: 'chama', gas: 'SO2', solido: null, aq: false, liga: ['S', 'O'],
    explica: 'Queima do enxofre com chama azulada, formando dióxido de enxofre, gás irritante e tóxico.' },
  { id: 'fe_o2', tipo: 'oxidacao', chaves: ['Fe', 'O'], eq: '4Fe(s) + 3O₂(g) → 2Fe₂O₃(s)', dH: -1648, g: 2, visual: null, gas: null, solido: '#b45309', aq: false, liga: ['Fe', 'O'],
    explica: 'Oxidação do ferro (ferrugem). Forma um sólido vermelho-alaranjado, de ligação iônica com forte caráter covalente.' },
  { id: 'cu_o2', tipo: 'oxidacao', chaves: ['Cu', 'O'], eq: '2Cu(s) + O₂(g) → 2CuO(s)', dH: -314, g: 2, visual: null, gas: null, solido: '#1f2937', aq: false, liga: ['Cu', 'O'],
    explica: 'Oxidação do cobre ao ar, formando óxido cúprico preto.' },
  { id: 'fe_s', tipo: 'sintese', chaves: ['Fe', 'S'], eq: 'Fe(s) + S(s) → FeS(s)', dH: -100, g: 2, visual: null, gas: null, solido: '#1f2937', aq: false, liga: ['Fe', 'S'],
    explica: 'Síntese de sulfeto de ferro, um sólido preto. Com ácidos, libera H₂S tóxico.' },
  { id: 'mg_hcl', tipo: 'deslocamento', chaves: ['Mg', 'HCl'], eq: 'Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)', dH: -467, g: 1, visual: null, gas: 'H2', solido: null, aq: true, liga: ['Mg', 'Cl'],
    explica: 'O magnésio, mais reativo que o hidrogênio, desloca o H₂ do ácido. Há borbulhamento intenso de hidrogênio.' },
  { id: 'al_hcl', tipo: 'deslocamento', chaves: ['Al', 'HCl'], eq: '2Al(s) + 6HCl(aq) → 2AlCl₃(aq) + 3H₂(g)', dH: -1030, g: 1, visual: null, gas: 'H2', solido: null, aq: true, liga: ['Al', 'Cl'],
    explica: 'O alumínio desloca o hidrogênio do ácido, mesmo com a camada de óxido. A reação se acelera com o tempo.' },
  { id: 'na_hcl', tipo: 'deslocamento', chaves: ['Na', 'HCl'], eq: '2Na(s) + 2HCl(aq) → 2NaCl(aq) + H₂(g)', dH: -483, g: 0, visual: 'faiscas', gas: 'H2', solido: null, aq: true, liga: ['Na', 'Cl'],
    explica: 'O sódio reage com o ácido de forma explosiva; o calor inflama o hidrogênio liberado.' },
  { id: 'zn_hcl', tipo: 'deslocamento', chaves: ['Zn', 'HCl'], eq: 'Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)', dH: -153, g: 2, visual: null, gas: 'H2', solido: null, aq: true, liga: ['Zn', 'Cl'],
    explica: 'Clássico deslocamento simples: o zinco substitui o hidrogênio do ácido, formando cloreto de zinco e H₂.' },
  { id: 'fe_hcl', tipo: 'deslocamento', chaves: ['Fe', 'HCl'], eq: 'Fe(s) + 2HCl(aq) → FeCl₂(aq) + H₂(g)', dH: -89, g: 2, visual: null, gas: 'H2', solido: null, aq: true, liga: ['Fe', 'Cl'],
    explica: 'O ferro é menos reativo que o zinco, então a reação com o ácido é mais lenta.' },
  { id: 'ca_hcl', tipo: 'deslocamento', chaves: ['Ca', 'HCl'], eq: 'Ca(s) + 2HCl(aq) → CaCl₂(aq) + H₂(g)', dH: -530, g: 1, visual: null, gas: 'H2', solido: null, aq: true, liga: ['Ca', 'Cl'],
    explica: 'O cálcio é muito reativo e desloca o hidrogênio do ácido com liberação de calor.' },
  { id: 'cu_hcl', tipo: 'semreacao', chaves: ['Cu', 'HCl'], eq: 'Cu(s) + HCl(aq) → sem reação', dH: 0, g: 2, visual: null, gas: null, solido: null, aq: false, liga: null,
    explica: 'O cobre está abaixo do hidrogênio na série de reatividade, então não desloca H₂ do ácido clorídrico.' }
];

function elementoPorSimbolo(s) {
  return ELEMENTOS_TP.find((e) => e.s === s);
}

// Ligação entre dois átomos pela diferença de eletronegatividade (Δχ)
function classificarLigacao(a, b) {
  const ea = elementoPorSimbolo(a);
  const eb = elementoPorSimbolo(b);
  if (!ea || !eb || ea.chi === null || eb.chi === null) return null;
  const metais = ['alcalino', 'alcalinoterroso', 'transicao', 'metalPos'];
  const delta = Math.abs(ea.chi - eb.chi);
  let tipo = delta > 1.7 ? 'iônica' : delta > 0.4 ? 'covalente polar' : 'covalente apolar';
  if (metais.includes(ea.g) && metais.includes(eb.g)) tipo = 'metálica';
  return { a, b, chiA: ea.chi, chiB: eb.chi, delta: delta.toFixed(2), tipo };
}

const DESCRICAO_LIGACAO = {
  'iônica': 'transferência de elétrons de um átomo menos eletronegativo para outro mais eletronegativo, formando íons que se atraem.',
  'covalente polar': 'compartilhamento desigual de elétrons; o átomo mais eletronegativo fica com carga parcial negativa.',
  'covalente apolar': 'compartilhamento igual de elétrons entre os átomos.',
  'metálica': 'elétrons deslocalizados entre cátions metálicos.'
};

// Quebra a equação nos produtos e obtém o estado físico e o risco de cada um
function parseProdutos(eq) {
  const lado = eq.split('→')[1] || '';
  return lado
    .split(' + ')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const estado = (t.match(/\((s|l|g|aq)\)$/) || [])[1] || '';
      const formula = t.replace(/^\d+/, '').replace(/\((s|l|g|aq)\)$/, '').trim();
      return {
        token: t,
        formula,
        estado: ESTADO_LABEL[estado] || '',
        risco: PRODUTOS_RISCO[formula] || 'Consulte a ficha de segurança deste produto.'
      };
    });
}

function analisarElementos(chaves) {
  const encontradas = REACOES_TP.filter((r) => r.chaves.every((c) => chaves.includes(c)));
  const ordenadas = [...encontradas].sort((a, b) => a.g - b.g);
  const soNobres = chaves.length > 0 && chaves.every((c) => ['He', 'Ne', 'Ar'].includes(c));

  const base = ordenadas[0] || (soNobres
    ? { tipo: 'inerte', eq: 'Sem reação (gases nobres)', dH: 0, g: 2, visual: null, gas: null, solido: null, aq: false, liga: null,
        explica: 'Gases nobres têm a camada de valência completa e quase não formam ligações com outros elementos.' }
    : { tipo: 'sem_reacao', eq: 'Sem reação prevista', dH: 0, g: 2, visual: null, gas: null, solido: null, aq: false, liga: null,
        explica: 'Nenhuma regra do modelo prevê reação entre estes elementos nas condições ambiente.' });

  const temProdutos = base.tipo !== 'semreacao' && base.tipo !== 'inerte' && base.tipo !== 'sem_reacao';
  const raw = Math.abs(base.dH) * 1000 / (250 * 4.18);
  const dT = base.aq ? (base.dH < 0 ? raw : -raw) : 0;

  return {
    tipo: base.tipo,
    tipoLabel: TIPO_LABEL[base.tipo] || base.tipo,
    eq: base.eq,
    dH: base.dH,
    exo: base.dH < 0,
    gravidade: base.g,
    visual: base.visual,
    gas: base.gas,
    solido: base.solido,
    aq: base.aq,
    dT,
    produtos: temProdutos ? parseProdutos(base.eq) : [],
    liga: base.liga ? classificarLigacao(base.liga[0], base.liga[1]) : null,
    explica: base.explica,
    outras: ordenadas.slice(1).map((r) => r.eq)
  };
}

function ModoElementos({ ehDesktop }) {
  const [escolhidos, setEscolhidos] = useState(['Na', 'Cl']);

  const alternar = (chave) => {
    setEscolhidos((atual) => {
      if (atual.includes(chave)) return atual.filter((k) => k !== chave);
      return atual.length < 4 ? [...atual, chave] : atual;
    });
  };

  const res = analisarElementos(escolhidos);
  const corLiquido = res.aq ? 'rgba(56, 189, 248, 0.55)' : 'rgba(100, 116, 139, 0.55)';
  const gasCor = res.gas ? GAS_COR[res.gas] : null;
  const dTVisual = res.dT;
  const dTTexto = res.aq && Math.abs(res.dT) > 75 ? 'acima de 100 °C (a água ferveria)' : `${res.dT >= 0 ? '+' : ''}${res.dT.toFixed(1)} °C`;
  const corTipo = res.gravidade === 0 ? '#dc2626' : res.gravidade === 1 ? CORES.laranja : CORES.cyan;
  const elementosEscolhidos = escolhidos.map((k) => elementoPorSimbolo(k)).filter(Boolean);

  return (
    <div style={{ ...estilos.cartao, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tabela Periódica · combinação de elementos</h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: CORES.textoSecundario }}>
          Escolha de 2 a 4 elementos ou compostos. O simulador identifica o tipo de reação, a equação balanceada e o que acontece no béquer.
        </p>
      </div>

      {/* Legenda dos grupos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.values(GRUPOS_ELEMENTOS).map((g) => (
          <span key={g.nome} style={{ fontSize: 11, color: g.cor, border: `1px solid ${g.cor}66`, background: `${g.cor}18`, borderRadius: 999, padding: '3px 10px' }}>
            {g.nome}
          </span>
        ))}
      </div>

      {/* Tabela periódica */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 720, display: 'grid', gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridAutoRows: '52px', gap: 3 }}>
          {ELEMENTOS_TP.map((e) => {
            const cor = GRUPOS_ELEMENTOS[e.g].cor;
            const sel = escolhidos.includes(e.s);
            return (
              <button
                key={e.s}
                onClick={() => alternar(e.s)}
                title={`${e.nome} · Z = ${e.z} · massa atômica ${e.m} u · eletronegatividade ${e.chi ?? '—'}`}
                style={{
                  gridRow: e.r,
                  gridColumn: e.c,
                  padding: 2,
                  borderRadius: 6,
                  border: `1px solid ${cor}`,
                  background: sel ? cor : `${cor}22`,
                  color: sel ? '#0f172a' : CORES.texto,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: sel ? `0 0 12px ${cor}` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 9, opacity: 0.8 }}>{e.z}</span>
                <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{e.s}</span>
                <span style={{ fontSize: 8, opacity: 0.8 }}>{e.m.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compostos e limpeza */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: CORES.textoSecundario }}>Compostos:</span>
        {COMPOSTOS_TP.map((c) => {
          const sel = escolhidos.includes(c.s);
          return (
            <button
              key={c.s}
              onClick={() => alternar(c.s)}
              style={{
                border: `1px solid ${sel ? CORES.cyan : CORES.bordaForte}`,
                background: sel ? 'rgba(34, 211, 238, 0.15)' : CORES.superficieAlt,
                color: sel ? CORES.cyan : CORES.texto,
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {c.formula} · {c.nome}
            </button>
          );
        })}
        <button
          onClick={() => setEscolhidos([])}
          style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${CORES.bordaForte}`, color: CORES.textoSecundario, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          Limpar
        </button>
      </div>

      {escolhidos.length < 2 ? (
        <p style={{ margin: 0, padding: 18, textAlign: 'center', fontSize: 13, color: CORES.textoSutil, border: `1px dashed ${CORES.bordaForte}`, borderRadius: 12 }}>
          Selecione pelo menos 2 elementos ou compostos para simular a reação.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: ehDesktop ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

          {/* Béquer com efeitos da reação */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 40, padding: 28, paddingTop: 90, background: CORES.fundo, borderRadius: 14, border: `1px solid ${CORES.borda}` }}>
            <div style={{ position: 'relative' }}>
              {res.visual === 'faiscas' && [0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    bottom: 200,
                    left: 60 + i * 8,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#fde047',
                    boxShadow: '0 0 6px #fde047',
                    '--dx': `${(i - 2.5) * 18}px`,
                    '--dy': `${-40 - i * 8}px`,
                    animation: `faisca ${0.8 + i * 0.15}s ease-out infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
              {(res.visual === 'chama' || res.visual === 'brilho') && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 200,
                    left: 50,
                    width: 50,
                    height: 40,
                    borderRadius: '50% 50% 40% 40%',
                    background: res.visual === 'brilho'
                      ? 'radial-gradient(circle, #ffffff, #fde68a 60%, transparent)'
                      : 'radial-gradient(circle at 50% 80%, #fde047, #f97316 60%, transparent)',
                    filter: 'blur(2px)',
                    transformOrigin: 'bottom center',
                    animation: res.visual === 'brilho' ? 'brilho 0.6s ease-in-out infinite' : 'chamaTremula 0.5s ease-in-out infinite'
                  }}
                />
              )}
              <Becher
                volume={250}
                cor={corLiquido}
                reacao={{ cor: gasCor, bolhas: Boolean(res.gas) || res.tipo === 'deslocamento', deltaT: dTVisual, fumaca: res.gas === 'Cl2' || res.gas === 'HCl' || res.visual === 'faiscas' }}
                precipFracao={res.solido ? 0.6 : 0}
                precipCor={res.solido || '#93c5fd'}
              />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <Termometro temperatura={25 + dTVisual} delta={dTVisual} percentual={Math.min(Math.max(((25 + dTVisual - 20) / 60) * 100, 8), 100)} />
            </div>
          </div>

          {/* Resultados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: `1px solid ${corTipo}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ alignSelf: 'flex-start', background: corTipo, color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {res.tipoLabel}
              </span>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 15, lineHeight: 1.6, color: CORES.texto }}>{res.eq}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                <span style={{ color: CORES.textoSecundario }}>Energia (ΔH, valor de referência)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: res.exo ? CORES.laranja : CORES.azul }}>
                  {res.dH.toFixed(0)} kJ · {res.tipo === 'sem_reacao' || res.tipo === 'inerte' || res.tipo === 'semreacao' ? 'sem reação' : res.exo ? 'exotérmica' : 'endotérmica'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                <span style={{ color: CORES.textoSecundario }}>Variação de temperatura (ΔT)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {res.aq ? dTTexto : 'não estimado (sem água no béquer)'}
                </span>
              </div>
              {res.aq && (
                <p style={{ margin: 0, fontSize: 11, color: CORES.textoSutil }}>
                  ΔT se 1 mol da reação, conforme a equação, aquecesse 250 g de água. Ilustrativo.
                </p>
              )}
            </div>

            {res.produtos.length > 0 && (
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 16 }}>
                <p style={{ ...estilos.rotulo, marginBottom: 10 }}>Produtos, estado físico e riscos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {res.produtos.map((p) => (
                    <div key={p.token} style={{ fontSize: 12 }}>
                      <p style={{ margin: 0 }}>
                        <strong style={{ fontFamily: 'monospace' }}>{p.formula}</strong>{' '}
                        <span style={{ color: CORES.cyan }}>({p.estado})</span>
                      </p>
                      <p style={{ margin: '2px 0 0', color: CORES.textoSecundario }}>{p.risco}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {res.liga && (
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 16 }}>
                <p style={{ ...estilos.rotulo, marginBottom: 8 }}>Ligação formada: {res.liga.tipo}</p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: CORES.texto }}>
                  Entre {res.liga.a} (χ = {res.liga.chiA}) e {res.liga.b} (χ = {res.liga.chiB}), Δχ = {res.liga.delta}: {DESCRICAO_LIGACAO[res.liga.tipo]}
                </p>
              </div>
            )}

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 16 }}>
              <p style={{ ...estilos.rotulo, marginBottom: 8 }}>Explicação</p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: CORES.texto }}>{res.explica}</p>
              {elementosEscolhidos.length > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 11, color: CORES.textoSutil }}>
                  Eletronegatividade: {elementosEscolhidos.map((e) => `${e.s} ${e.chi ?? '—'}`).join(' · ')}
                </p>
              )}
              {res.outras.length > 0 && (
                <p style={{ margin: '10px 0 0', fontSize: 11, color: CORES.textoSutil }}>
                  Outras reações possíveis: {res.outras.join(' ; ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11, color: CORES.textoSutil }}>
        Os ΔH são valores de referência aproximados de livros-texto. O modelo cobre apenas as reações listadas; não é um banco completo de reações.
      </p>
    </div>
  );
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

function Becher({ volume, cor, reacao, precipFracao, precipCor = '#93c5fd' }) {
  const alturaLiquido = Math.min((volume / 1000) * 100, 90);
  const temFumaca = reacao.cor && (reacao.deltaT > 15 || reacao.fumaca);

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
      {/* Fumaça / vapor acima do béquer */}
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
            background: reacao.cor,
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

        {/* Precipitado no fundo (Cu(OH)₂) */}
        {precipFracao > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${precipFracao * 30}%`,
            background: `repeating-radial-gradient(circle at 30% 40%, ${precipCor} 0 2px, ${precipCor}99 2px 4px)`,
            opacity: 0.85,
            transition: 'height 0.8s ease'
          }} />
        )}
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
      <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{temperatura.toFixed(1)}°C</span>
      <span style={{ fontSize: 11, color: delta < 0 ? CORES.azul : CORES.amarelo }}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}°C</span>
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

// Curvas de concentração plasmática vs. tempo (0 a 8 h), normalizadas pelo pico
function GraficoPlasma({ curvas }) {
  const L = 40;
  const W = 340;
  const T = 20;
  const H = 150;
  const x = (t) => L + (t / 8) * W;
  const y = (c) => T + H - c * H;

  if (curvas.length === 0) {
    return <p style={{ margin: 0, fontSize: 12, color: CORES.textoSutil }}>Nenhuma substância absorvível na mistura atual.</p>;
  }

  return (
    <svg viewBox="0 0 400 200" width="100%" role="img" aria-label="Curva de concentração plasmática">
      <line x1={L} y1={T + H} x2={L + W} y2={T + H} stroke="#475569" />
      <line x1={L} y1={T} x2={L} y2={T + H} stroke="#475569" />
      {[0, 2, 4, 6, 8].map((h) => (
        <text key={h} x={x(h)} y={T + H + 14} fontSize="10" textAnchor="middle" fill="#94a3b8">{h}h</text>
      ))}
      <text x={6} y={T + 4} fontSize="9" fill="#94a3b8">100%</text>
      {curvas.map((c) => {
        const d = c.pontos.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x((i * 8) / 60).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
        return (
          <g key={c.id}>
            <path d={d} fill="none" stroke={c.cor} strokeWidth="2.5" />
            <line x1={x(c.tmax)} y1={y(1)} x2={x(c.tmax)} y2={T + H} stroke={c.cor} strokeDasharray="3 3" opacity="0.6" />
          </g>
        );
      })}
    </svg>
  );
}

function CartaoMetrica({ titulo, linhas }) {
  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 14 }}>
      <p style={{ ...estilos.rotulo, marginBottom: 10 }}>{titulo}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {linhas.map((l) => (
          <div key={l.rotulo} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
            <span style={{ color: CORES.textoSecundario }}>{l.rotulo}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: l.cor || CORES.texto }}>{l.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelaExames({ titulo, linhas }) {
  return (
    <div style={estilos.cartao}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>{titulo}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: CORES.textoSecundario, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <th style={{ padding: '6px 4px', fontWeight: 700 }}>Exame</th>
            <th style={{ padding: '6px 4px', fontWeight: 700 }}>Resultado</th>
            <th style={{ padding: '6px 4px', fontWeight: 700 }}>Referência</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.nome} style={{ borderTop: `1px solid ${CORES.borda}` }}>
              <td style={{ padding: '8px 4px' }}>{l.nome}</td>
              <td style={{ padding: '8px 4px', fontFamily: 'monospace', fontWeight: 700, color: l.seta ? CORES.laranja : CORES.texto }}>
                {l.valor} {l.unidade} {l.seta}
              </td>
              <td style={{ padding: '8px 4px', fontFamily: 'monospace', color: CORES.textoSutil }}>{l.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

  const [selecionadas, setSelecionadas] = useState(() => [
    SUBSTANCIAS.find((s) => s.id === 'h2so4'),
    SUBSTANCIAS.find((s) => s.id === 'naoh')
  ]);
  const [volume, setVolume] = useState(250);
  const [abaAtiva, setAbaAtiva] = useState('lab');
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [orgaoSelecionado, setOrgaoSelecionado] = useState(null);
  const [inicioExposicao, setInicioExposicao] = useState(null);
  const [agora, setAgora] = useState(() => Date.now());

  const [novaSubstancia, setNovaSubstancia] = useState({
    nome: '', formula: '', categoria: 'Produtos Domésticos', ph: 7, cor: '#10b981', descricao: ''
  });

  useEffect(() => {
    salvarPersonalizadas(personalizadas);
  }, [personalizadas]);

  // Contagem regressiva das janelas de antídoto
  useEffect(() => {
    if (inicioExposicao === null) return undefined;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [inicioExposicao]);

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
    // Substância personalizada: comportamento aproximado pelo pH informado
    const modelo = phValor < 6
      ? { conc: 10 ** -phValor, acido: { forte: true, n: 1 } }
      : phValor > 8
      ? { conc: 10 ** (phValor - 14), base: { forte: true, n: 1, sal: true } }
      : { conc: 0 };
    const criada = {
      nome: novaSubstancia.nome.trim(),
      formula: novaSubstancia.formula.trim() || '—',
      categoria: novaSubstancia.categoria,
      cor: novaSubstancia.cor,
      descricao: novaSubstancia.descricao.trim() || 'Substância cadastrada pelo usuário.',
      id: `custom_${Date.now()}`,
      tipo: 'custom',
      ph: phValor,
      personalizada: true,
      ...modelo
    };
    setPersonalizadas([...personalizadas, criada]);
    setNovaSubstancia({ nome: '', formula: '', categoria: 'Produtos Domésticos', ph: 7, cor: '#10b981', descricao: '' });
  };

  // Cálculos
  const mix = useMemo(() => calcularMistura(selecionadas, volume), [selecionadas, volume]);
  const severidade = calcularSeveridade(selecionadas, mix);
  const corSolucao = corDaSolucao(selecionadas, mix.pH);
  const organos = avaliarOrgaos(selecionadas, mix, severidade);
  const metricas = calcularMetricas(selecionadas, mix, severidade, organos);
  const antidotos = listarAntidotos(selecionadas, metricas, mix);
  const curvas = curvasPlasma(selecionadas);

  const orgaoFoco = organos.find((o) => o.id === orgaoSelecionado)
    || [...organos].sort((a, b) => b.nivel - a.nivel)[0];
  const detalheFoco = orgaoFoco.nivel > 0 ? DETALHES_ORGAOS[orgaoFoco.id][orgaoFoco.nivel] : null;
  const orgaosEmRisco = organos.filter((o) => o.nivel > 0);

  const nivelTermometro = Math.min(Math.max(((mix.tFinal - 20) / 60) * 100, 8), 100);
  const pressaoGastrica = (mix.gasMol * R_ATM * (273.15 + mix.tFinal)) / VOL_ESTOMAGO_L;
  const riscoGas = pressaoGastrica > 3 ? 'Risco de ruptura gástrica' : pressaoGastrica > 1 ? 'Distensão gástrica' : 'Sem distensão relevante';

  // Busca e filtro do catálogo
  const termo = normalizar(busca.trim());
  const casaBusca = (s) => !termo || normalizar(s.nome).includes(termo) || normalizar(s.formula).includes(termo);
  const encontradas = catalogo.filter((s) => casaBusca(s) && (!filtroCategoria || s.categoria === filtroCategoria));
  const contagemPorFiltro = (valor) => catalogo.filter((s) => casaBusca(s) && (!valor || s.categoria === valor)).length;

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

  const linhasGasometria = [
    { nome: 'pH arterial', valor: metricas.phSangue.toFixed(2), unidade: '', ref: '7,35 – 7,45', seta: flag(metricas.phSangue, 7.35, 7.45) },
    { nome: 'PaCO₂', valor: metricas.pco2, unidade: 'mmHg', ref: '35 – 45', seta: flag(metricas.pco2, 35, 45) },
    { nome: 'HCO₃⁻', valor: metricas.hco3, unidade: 'mEq/L', ref: '22 – 26', seta: flag(metricas.hco3, 22, 26) },
    { nome: 'Ânion gap', valor: metricas.ag, unidade: 'mEq/L', ref: '8 – 16', seta: flag(metricas.ag, 8, 16) }
  ];
  const linhasHemograma = [
    { nome: 'Leucócitos', valor: metricas.leucocitos.toLocaleString('pt-BR'), unidade: '/mm³', ref: '4.000 – 11.000', seta: flag(metricas.leucocitos, 4000, 11000) },
    { nome: 'Hemoglobina', valor: metricas.hb, unidade: 'g/dL', ref: '13,5 – 17,5', seta: flag(metricas.hb, 13.5, 17.5) },
    { nome: 'Plaquetas', valor: metricas.plaquetas.toLocaleString('pt-BR'), unidade: '/mm³', ref: '150.000 – 450.000', seta: flag(metricas.plaquetas, 150000, 450000) }
  ];
  const linhasRenal = [
    { nome: 'TFG', valor: metricas.tfg, unidade: 'mL/min/1,73m²', ref: '≥ 90', seta: flag(metricas.tfg, 90, 200) },
    { nome: 'Creatinina', valor: metricas.creat, unidade: 'mg/dL', ref: '0,6 – 1,3', seta: flag(metricas.creat, 0.6, 1.3) },
    { nome: 'Ureia', valor: metricas.ureia, unidade: 'mg/dL', ref: '15 – 40', seta: flag(metricas.ureia, 15, 40) }
  ];
  const linhasHepatico = [
    { nome: 'TGP (ALT)', valor: metricas.alt, unidade: 'U/L', ref: '7 – 56', seta: flag(metricas.alt, 7, 56) },
    { nome: 'TGO (AST)', valor: metricas.ast, unidade: 'U/L', ref: '10 – 40', seta: flag(metricas.ast, 10, 40) },
    { nome: 'Glutationa reduzida (GSH)', valor: metricas.gsh, unidade: '% do normal', ref: '≥ 80', seta: flag(metricas.gsh, 80, 200) },
    { nome: 'INR', valor: metricas.inr, unidade: '', ref: '0,8 – 1,2', seta: flag(metricas.inr, 0.8, 1.2) }
  ];

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
            {ABAS.map((aba) => {
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
        gridTemplateColumns: ehDesktop && abaAtiva !== 'elementos' ? '380px 1fr' : '1fr',
        gap: 24,
        alignItems: 'start'
      }}>

        {/* Coluna esquerda: mistura, atalhos, catálogo e cadastro */}
        <aside style={{ display: abaAtiva === 'elementos' ? 'none' : 'flex', flexDirection: 'column', gap: 20 }} className="no-print">

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
                    <Becher volume={volume} cor={corSolucao} reacao={mix.primaria} precipFracao={mix.precip.fracao} />
                    <p style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: CORES.textoSecundario }}>
                      Béquer Graduado ({volume} ml)
                    </p>
                  </div>

                  <Termometro temperatura={mix.tFinal} delta={mix.dT} percentual={nivelTermometro} />
                </div>

                {/* Cálculos, tempo útil e equação */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: `1px solid ${CORES.bordaForte}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>pH calculado (pKa/pKb)</span>
                      <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: CORES.cyan }}>{mix.pH.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>Calor da reação (ΔH)</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{mix.dH.toFixed(1)} kJ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>Temperatura final</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: mix.dT > 15 ? CORES.laranja : CORES.texto }}>
                        {mix.tFinal.toFixed(1)}°C ({mix.dT >= 0 ? '+' : ''}{mix.dT.toFixed(1)})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>Gás produzido</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{mix.gasMol.toFixed(4)} mol</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, color: CORES.textoSecundario }}>Pressão em estômago de 1 L (PV = nRT)</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: pressaoGastrica > 1 ? CORES.laranja : CORES.texto }}>
                        {pressaoGastrica.toFixed(2)} atm
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: pressaoGastrica > 1 ? CORES.laranja : CORES.textoSutil }}>{riscoGas}</p>
                    {mix.precip.fracao > 0 && (
                      <p style={{ margin: 0, fontSize: 12, color: '#93c5fd' }}>
                        Precipitado de Cu(OH)₂ formado (Q = {mix.precip.Q.toExponential(1)} &gt; Ksp = {mix.precip.ksp.toExponential(1)})
                      </p>
                    )}

                    {/* Escala de pH */}
                    <div>
                      <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7)' }}>
                        <div style={{
                          position: 'absolute',
                          top: -4,
                          left: `calc(${(mix.pH / 14) * 100}% - 6px)`,
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
                    <p style={{ ...estilos.rotulo, color: CORES.cyan, marginBottom: 8 }}>
                      Equação química · {mix.primaria.titulo}
                    </p>
                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, lineHeight: 1.5, color: CORES.texto }}>
                      {mix.primaria.equacao}
                    </p>
                    {mix.reacoes.length > 1 && (
                      <p style={{ margin: '10px 0 0', fontSize: 11, color: CORES.textoSutil }}>
                        Outras reações: {mix.reacoes.slice(1).map((r) => r.titulo).join('; ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p style={{ margin: '16px 0 0', fontSize: 11, color: CORES.textoSutil }}>
                pH por balanço de cargas com pKa/pKb; ΔH com valores de tabela aproximados; ΔT = Q/(m·c) com m ≈ volume e c = 4,18 J/(g·K).
                Modelo didático: não considera todas as espécies nem a cinética da reação.
              </p>
            </div>
          )}

          {/* ABA 2: FISIOLOGIA HUMANA */}
          {abaAtiva === 'body' && (
            <div style={{ ...estilos.cartao, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={20} color={CORES.rosa} />
                  Degradação Fisiológica e Progressão Toxicológica
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: CORES.textoSecundario }}>
                  Clique em um órgão para ver os danos e o tempo estimado de complicação. Os órgãos em risco piscam.
                </p>
              </div>

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

              {/* Toxicodinâmica das vias aéreas e do estômago */}
              <div style={{ display: 'grid', gridTemplateColumns: ehDesktop ? '1fr 1fr' : '1fr', gap: 12 }}>
                <CartaoMetrica
                  titulo="Vias aéreas e glote"
                  linhas={[
                    { rotulo: 'Risco de broncoespasmo', valor: `${metricas.broncoespasmo}%`, cor: metricas.broncoespasmo > 50 ? CORES.laranja : undefined },
                    { rotulo: 'Risco de edema de glote', valor: `${metricas.edemaGlote}%`, cor: metricas.edemaGlote > 30 ? CORES.laranja : undefined }
                  ]}
                />
                <CartaoMetrica
                  titulo="Esôfago e estômago (Zargar)"
                  linhas={[
                    { rotulo: 'Grau de lesão', valor: metricas.grauZargar || 'Sem lesão cáustica', cor: metricas.grauZargar ? CORES.laranja : undefined },
                    { rotulo: 'Risco de perfuração', valor: `${metricas.perfuracao}%`, cor: metricas.perfuracao >= 20 ? CORES.vermelho : undefined }
                  ]}
                />
              </div>

              {/* Curva plasmática */}
              <div>
                <p style={{ ...estilos.rotulo, marginBottom: 8 }}>Concentração plasmática vs. tempo (ilustrativo)</p>
                <div style={{ background: CORES.fundo, borderRadius: 12, border: `1px solid ${CORES.borda}`, padding: 12 }}>
                  <GraficoPlasma curvas={curvas} />
                  {curvas.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 11, color: CORES.textoSecundario }}>
                      {curvas.map((c) => (
                        <span key={c.id}>
                          <span style={{ color: c.cor, fontWeight: 700 }}>■</span> {c.nome}: T<sub>max</sub> ≈ {c.tmax.toFixed(1)} h, C<sub>max</sub> = pico (100%)
                        </span>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: CORES.textoSutil }}>
                    Curvas de absorção e eliminação normalizadas pelo pico, com constantes ilustrativas. Não dependem da dose.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: EXAMES */}
          {abaAtiva === 'exames' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={estilos.cartao}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Painel de exames simulados</h2>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: CORES.textoSecundario }}>
                  Valores ilustrativos calculados a partir da mistura atual. Não são laudos reais.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: ehDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <TabelaExames titulo="Gasometria arterial" linhas={linhasGasometria} />
                <TabelaExames titulo="Hemograma" linhas={linhasHemograma} />
                <TabelaExames titulo="Função renal" linhas={linhasRenal} />
                <TabelaExames titulo="Função hepática" linhas={linhasHepatico} />
              </div>
            </div>
          )}

          {/* ABA 4: PRIMEIROS SOCORROS */}
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
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Janelas de antídoto e condutas</h3>
                {antidotos.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: CORES.textoSecundario }}>Nenhum antídoto específico para a mistura atual.</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      {inicioExposicao === null ? (
                        <Botao onClick={() => { setInicioExposicao(Date.now()); setAgora(Date.now()); }} cor={CORES.azul}>
                          <Clock size={14} /> Registrar exposição agora
                        </Botao>
                      ) : (
                        <>
                          <span style={{ fontSize: 13, color: CORES.textoSecundario }}>
                            Tempo desde a exposição: <strong style={{ color: CORES.texto, fontFamily: 'monospace' }}>{formatarTempo((agora - inicioExposicao) / 1000)}</strong>
                          </span>
                          <button
                            onClick={() => setInicioExposicao(null)}
                            style={{ background: 'none', border: `1px solid ${CORES.bordaForte}`, color: CORES.textoSecundario, borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
                          >
                            Zerar contagem
                          </button>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {antidotos.map((a) => {
                        const decorridoMin = inicioExposicao === null ? 0 : (agora - inicioExposicao) / 60000;
                        const restanteMin = a.janelaMin - decorridoMin;
                        const expirada = inicioExposicao !== null && restanteMin <= 0 && a.janelaMin > 0;
                        const cor = expirada ? CORES.textoSutil : restanteMin < 60 && inicioExposicao !== null ? CORES.vermelho : CORES.cyan;
                        return (
                          <div key={a.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 14, borderRadius: 10, background: CORES.superficieAlt, border: `1px solid ${CORES.bordaForte}` }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{a.nome}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: CORES.textoSecundario }}>{a.motivo} • {a.nota}</p>
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: cor, whiteSpace: 'nowrap' }}>
                              {a.janelaMin === 0
                                ? 'Imediato'
                                : inicioExposicao === null
                                ? `Janela: ${a.janelaMin >= 60 ? `${a.janelaMin / 60} h` : `${a.janelaMin} min`}`
                                : expirada
                                ? 'Janela expirada'
                                : `Restam ${formatarTempo(restanteMin * 60)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
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

          {/* ABA: TABELA PERIÓDICA */}
          {abaAtiva === 'elementos' && <ModoElementos ehDesktop={ehDesktop} />}

          {/* ABA 5: RELATÓRIO CLÍNICO */}
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
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[pH CALCULADO]:</strong> {mix.pH.toFixed(2)}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[REAÇÃO]:</strong> {mix.primaria.titulo}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[ΔH / ΔT]:</strong> {mix.dH.toFixed(1)} kJ / {mix.dT.toFixed(1)} °C</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[GÁS PRODUZIDO]:</strong> {mix.gasMol.toFixed(4)} mol (pressão estimada {pressaoGastrica.toFixed(2)} atm em 1 L)</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[AVALIAÇÃO DE RISCO]:</strong> {severidade.nivel}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[TEMPO ÚTIL]:</strong> {severidade.tempo}</p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: CORES.texto }}>[ÓRGÃOS EM RISCO]:</strong>{' '}
                  {orgaosEmRisco.length ? orgaosEmRisco.map((o) => `${o.nome} (${o.nivel === 2 ? 'crítico' : 'atenção'})`).join(', ') : 'Nenhum'}
                </p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[ZARGAR]:</strong> {metricas.grauZargar || 'Sem lesão cáustica'}</p>
                <p style={{ margin: 0 }}><strong style={{ color: CORES.texto }}>[GASOMETRIA]:</strong> pH {metricas.phSangue.toFixed(2)}, HCO₃⁻ {metricas.hco3}, ânion gap {metricas.ag}</p>
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
