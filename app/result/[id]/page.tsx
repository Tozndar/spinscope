"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/store";

const LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string; bar: number }> = {
  "נמוך": { color: "#22c55e", bg: "#22c55e15", label: "ספין נמוך", bar: 25 },
  "בינוני": { color: "#f59e0b", bg: "#f59e0b15", label: "ספין בינוני", bar: 60 },
  "גבוה": { color: "#ef4444", bg: "#ef444415", label: "ספין גבוה", bar: 90 },
};

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try sessionStorage first (fresh analysis)
    const cached = sessionStorage.getItem(`spinscope_${params.id}`);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
        return;
      } catch {}
    }
    // Fallback to API (won't work on serverless but kept for future DB)
    fetch(`/api/result/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError("הניתוח פג תוקף — חזור לדף הבית ונסה שוב");
        else setResult(d);
      })
      .catch(() => setError("שגיאה בטעינה"));
  }, [params.id]);

  const handleCopy = () => {
    if (!result) return;
    const text = `🔍 SpinScope ניתח את: "${result.articleTitle}"

ספין: ${result.spin.level}
${result.spin.summary}

מה חסר: ${result.spin.whatMissing}

${result.verdict}

🔗 spinscope.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-red-400 text-lg">⚠️ {error}</p>
        <button onClick={() => router.push("/")} className="text-white/50 hover:text-white text-sm underline">חזרה</button>
      </div>
    </div>
  );

  if (!result) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-pulse">🔍</div>
        <p className="text-white/50">טוען ניתוח...</p>
      </div>
    </div>
  );

  const cfg = LEVEL_CONFIG[result.spin.level] || LEVEL_CONFIG["בינוני"];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm">→</button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm">🔍</div>
        <span className="font-bold text-lg tracking-tight">SpinScope</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="text-white/40 text-sm">{result.articleSource}</div>
        <h1 className="text-xl font-bold leading-snug text-white/90">{result.articleTitle}</h1>

        {/* Spin meter */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg" style={{ color: cfg.color }}>{cfg.label}</span>
            <span className="text-3xl">{result.spin.level === "נמוך" ? "🟢" : result.spin.level === "בינוני" ? "🟡" : "🔴"}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${cfg.bar}%`, background: cfg.color }} />
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{result.spin.summary}</p>
        </div>

        {/* Verdict */}
        {result.verdict && (
          <div className="rounded-2xl p-5 bg-white/5 border border-white/10 space-y-2">
            <p className="text-orange-400 text-xs font-semibold tracking-wider">פסיקת SpinScope</p>
            <p className="text-white font-medium leading-relaxed">&ldquo;{result.verdict}&rdquo;</p>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: "📣", label: "מה הכתבה מדגישה", value: result.spin.whatEmphasized },
            { icon: "🕳️", label: "מה חסר", value: result.spin.whatMissing },
            { icon: "🎯", label: "מי נהנה", value: result.spin.whoBenefits },
            { icon: "🎭", label: "מסגרת רגשית", value: result.spin.framing },
          ].filter(i => i.value).map((item) => (
            <div key={item.label} className="rounded-xl p-4 bg-white/3 border border-white/8 space-y-1">
              <p className="text-white/40 text-xs flex items-center gap-1.5"><span>{item.icon}</span>{item.label}</p>
              <p className="text-white/85 text-sm leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Related */}
        {result.relatedArticles.length > 0 && (
          <div className="space-y-3">
            <p className="text-white/40 text-xs font-semibold tracking-wider">כתבות אחרות על אותו נושא</p>
            {result.relatedArticles.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl p-4 bg-white/3 border border-white/8 hover:border-white/20 hover:bg-white/6 transition-all">
                <p className="text-white/30 text-xs mb-1">{a.source}</p>
                <p className="text-white/80 text-sm leading-snug">{a.title}</p>
              </a>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="pt-2 pb-8">
          <button onClick={handleCopy} className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 bg-gradient-to-r from-orange-500 to-red-600">
            {copied ? "✅ הועתק!" : "📤 שתף את הניתוח"}
          </button>
        </div>
      </div>
    </main>
  );
}
