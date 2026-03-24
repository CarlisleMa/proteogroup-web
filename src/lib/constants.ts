export const METHOD_FAMILIES = [
  'Coef',
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

export const ENRICHMENT_SOURCES = [
  'GO:BP',
  'GO:MF',
  'GO:CC',
  'KEGG',
  'REAC',
] as const;

export type EnrichmentSource = (typeof ENRICHMENT_SOURCES)[number];
