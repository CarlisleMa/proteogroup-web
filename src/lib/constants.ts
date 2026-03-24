export const METHOD_FAMILIES = [
  'Coef',
  'CAV',
  'CAVtop',
  'Thresh',
  'PLS',
  'NMF',
  'Neural',
  'ContNeural',
  'Health',
  'HealthTri',
  'HealthCont',
  'Foundation',
  'Sparse',
] as const;

export type MethodFamily = (typeof METHOD_FAMILIES)[number];

export const DISEASE_DISPLAY_NAMES: Record<string, string> = {
  death: 'Mortality',
  esrd: 'ESRD',
  hf: 'Heart Failure',
  stroke: 'Stroke',
  mi: 'MI',
  af: 'Atrial Fibrillation',
  copd: 'COPD',
  diabetes: 'Diabetes',
  dementia: 'Dementia',
  alz: "Alzheimer's",
  parkinsons: "Parkinson's",
  cancer: 'Cancer',
};

export const TIER_COLORS: Record<string, string> = {
  Tier1_Novel: 'bg-emerald-100 text-emerald-800',
  Tier2_Confirmatory: 'bg-amber-100 text-amber-800',
  Tier3_Exploratory: 'bg-slate-100 text-slate-600',
};

export const METHOD_FAMILY_COLORS: Record<string, string> = {
  Coef: '#3b82f6',
  CAV: '#ef4444',
  CAVtop: '#f97316',
  Thresh: '#22c55e',
  PLS: '#8b5cf6',
  NMF: '#ec4899',
  Neural: '#06b6d4',
  ContNeural: '#14b8a6',
  Health: '#f59e0b',
  HealthTri: '#d97706',
  HealthCont: '#eab308',
  Foundation: '#6366f1',
  Sparse: '#64748b',
};

export const BIOMARKER_COMPONENT_COLORS: Record<string, { color: string; label: string }> = {
  predictive_importance: { color: '#3b82f6', label: 'Predictive' },
  disease_specificity: { color: '#ef4444', label: 'Disease Spec.' },
  pathway_membership: { color: '#22c55e', label: 'Pathway' },
  network_centrality: { color: '#f59e0b', label: 'Network' },
  novelty_score: { color: '#8b5cf6', label: 'Novelty' },
  cross_method_consistency: { color: '#06b6d4', label: 'Cross-Method' },
  tissue_interpretability: { color: '#ec4899', label: 'Tissue' },
};

export const ENRICHMENT_SOURCES = [
  'GO:BP',
  'GO:MF',
  'GO:CC',
  'KEGG',
  'REAC',
] as const;

export type EnrichmentSource = (typeof ENRICHMENT_SOURCES)[number];
