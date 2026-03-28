/* ------------------------------------------------------------------ */
/*  Method types                                                      */
/* ------------------------------------------------------------------ */

export interface MethodSummary {
  method_name: string;
  method_family: string;
  k: number;
  n_proteins_assigned: number;
  mean_group_size: number;
  group_size_cv: number;
  age_mae: number;
  age_r2: number;
  pearson_r: number;
  bootstrap_mean_ari: number;
}

export interface MethodDetail {
  metadata: Record<string, unknown>;
  age_prediction: Record<string, unknown>;
  survival: Record<string, unknown>;
  variance_explained: Record<string, unknown>;
  correlation: Record<string, unknown>;
  string_ppi: Record<string, unknown>;
  enrichment_summary: EnrichmentTerm[];
  top_nominations: BiomarkerNomination[];
}

/* ------------------------------------------------------------------ */
/*  Proteogroup types                                                 */
/* ------------------------------------------------------------------ */

export interface ProteogroupProtein {
  protein: string;
  gene_name: string | null;
  ridge_coef: number | null;
}

export interface ProteogroupFigure {
  filename: string;
  figure_type: string;
  file_path: string;
}

export interface ProteogroupBiomarker {
  composite_score: number | null;
  tier: string | null;
  predictive_importance: number | null;
  disease_specificity: number | null;
  pathway_membership: number | null;
  network_centrality: number | null;
  novelty_score: number | null;
  cross_method_consistency: number | null;
  tissue_interpretability: number | null;
  top_proteins: unknown[] | null;
}

export interface ProteogroupDetail {
  method_name: string;
  group_id: number | string;
  n_proteins: number;
  proteins: ProteogroupProtein[];
  enrichment: EnrichmentTerm[];
  enrichment_summary: Record<string, unknown>;
  disease_associations: DiseaseAssociation[];
  cox_results: Record<string, unknown>[];
  string_ppi: Record<string, unknown>;
  biomarker: ProteogroupBiomarker | null;
  permutation_importance: Record<string, unknown>;
  pathway_uniqueness: Record<string, unknown>;
  correlation_structure: Record<string, unknown>;
  reviews: ReviewAnnotation[];
  figures: ProteogroupFigure[];
}

/* ------------------------------------------------------------------ */
/*  Protein types                                                     */
/* ------------------------------------------------------------------ */

export interface ProteinDetail {
  protein: string;
  gene_name: string;
  uniprot_id: string;
  function_text: string;
  subcellular_location: string;
  hpa: Record<string, unknown>;
  pubmed: Record<string, unknown>[];
  opentargets: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  coefficients: Record<string, unknown>[];
}

export interface ProteinSearchResult {
  protein: string;
  gene_name: string;
  uniprot_id: string;
}

/* ------------------------------------------------------------------ */
/*  Disease & enrichment types                                        */
/* ------------------------------------------------------------------ */

export interface DiseaseAssociation {
  method_name: string;
  score_column: string;
  outcome: string;
  p_value: number;
  cohens_d: number;
  mean_case: number;
  mean_control: number;
  n_case: number;
}

export interface EnrichmentTerm {
  source: string;
  term_id: string;
  term_name: string;
  p_value: number;
  term_size: number;
  intersection_size: number;
}

/* ------------------------------------------------------------------ */
/*  Biomarker types                                                   */
/* ------------------------------------------------------------------ */

export interface BiomarkerNomination {
  method_name: string;
  pg_group: number;
  composite_score: number;
  tier: string;
  predictive_importance: number;
  disease_specificity: number;
  pathway_membership: number;
  network_centrality: number;
  novelty_score: number;
  cross_method_consistency: number;
  tissue_interpretability: number;
  top_proteins: string[];
}

/* ------------------------------------------------------------------ */
/*  Review types                                                      */
/* ------------------------------------------------------------------ */

export interface ReviewAnnotation {
  id: string;
  reviewer: string;
  biological_plausibility: number;
  clinical_relevance: number;
  notes: string;
  tags: string[];
  status: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Chat types                                                        */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  context_chunks?: string[];
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Dashboard types                                                   */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  n_methods: number;
  n_proteins: number;
  n_families: number;
  n_diseases: number;
  top_method: string;
  tier_counts: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                        */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

/* ------------------------------------------------------------------ */
/*  Network graph types                                                */
/* ------------------------------------------------------------------ */

export interface NetworkNodeDisease {
  outcome: string;
  cohens_d: number | null;
  p_value: number | null;
  n_case: number | null;
}

export interface NetworkNode {
  group_id: number;
  n_proteins: number;
  composite_score: number | null;
  tier: string | null;
  top_proteins: string[];
  dominant_theme: string | null;
  top_pathway: string | null;
  n_enriched_terms: number | null;
  strongest_disease: string | null;
  strongest_disease_d: number | null;
  disease_associations: NetworkNodeDisease[];
  ppi_enrichment_p: number | null;
  avg_clustering: number | null;
  mean_within_corr: number | null;
  corr_ratio: number | null;
  predictive_importance: number | null;
  disease_specificity: number | null;
  network_centrality: number | null;
  // d3-force simulation fields (mutated at runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkEdge {
  source: number | NetworkNode;
  target: number | NetworkNode;
  shared_theme: string | null;
  weight: number;
}

export interface NetworkGraphData {
  method_name: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}
