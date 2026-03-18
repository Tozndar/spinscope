export type AnalysisResult = {
  id: string;
  createdAt: number;
  articleTitle: string;
  articleSource: string;
  articleText: string;
  spin: {
    level: "נמוך" | "בינוני" | "גבוה";
    summary: string;
    whatEmphasized: string;
    whatMissing: string;
    whoBenefits: string;
    framing: string;
  };
  relatedArticles: {
    title: string;
    url: string;
    source: string;
  }[];
  verdict: string;
};

const store = new Map<string, AnalysisResult>();

export function saveResult(result: AnalysisResult) {
  store.set(result.id, result);
}

export function getResult(id: string): AnalysisResult | undefined {
  return store.get(id);
}
