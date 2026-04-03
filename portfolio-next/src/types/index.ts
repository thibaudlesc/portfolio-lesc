// ─── Project / Case Study ────────────────────────────────────────────────────

export interface Project {
  slug:        string;
  title:       string;
  tagline:     string;
  year:        number;
  role:        string[];
  stack:       string[];
  /** Metric visible sur la card — ex: "Premier projet dev complet" */
  impact:      string;
  coverImage:  string;
  video?:      string;
  featured:    boolean;
  status:      "live" | "wip" | "done";
  links: {
    live?:     string;
    github?:   string;
    appStore?: string;
  };
  caseStudy: CaseStudy;
}

export interface CaseStudy {
  problem:  string;
  approach: string;
  outcome:  string;
  sections: CaseSection[];
}

export type CaseSection =
  | { type: "text";   content: string }
  | { type: "code";   content: string; lang?: string }
  | { type: "metric"; content: MetricBlock }
  | { type: "image";  content: ImageBlock }
  | { type: "split";  left: string; right: string };

export interface MetricBlock {
  label: string;
  value: string;
  delta?: string;
}

export interface ImageBlock {
  src:      string;
  alt:      string;
  caption?: string;
}

// ─── Lab ─────────────────────────────────────────────────────────────────────

export interface LabExperiment {
  slug:        string;
  title:       string;
  description: string;
  tags:        string[];
  date:        string;
  url?:        string;
  repo?:       string;
}

// ─── Blog ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug:        string;
  title:       string;
  description: string;
  date:        string;
  tags:        string[];
  readingTime: number;
}
