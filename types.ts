export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
  status: string;
  usage_daily: number;
  limit_daily: number;
}

export interface AnalysisResult {
  feasibility_check: {
    is_possible: boolean;
    status_title: string;
    reason: string;
  };
  disease_treatment?: {
    detected: boolean;
    name: string;
    cause: string;
    steps: string[];
  };
  deep_propagation?: {
    seed_treatment: string;
    propagation_source: string;
    special_technique: string;
    step_by_step: string;
  };
  propagation_guide?: {
    best_method: string;
    propagation_steps: string[];
    pruning_advice: string;
  };
  resilience_profile?: {
    drought: { level: string; advice: string };
    flood: { level: string; advice: string };
    sun: { level: string; advice: string };
  };
  action_timeline: {
    period: string;
    action: string;
    details: string;
  }[];
  transplant_advice?: {
    needed: boolean;
    trigger: string;
    method: string;
  };
  soil_adjustment_detailed?: string;
  organic_wisdom?: {
    soil_prep: string;
    fertilizer_recipe: string;
  };
}
