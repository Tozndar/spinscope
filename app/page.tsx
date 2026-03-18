"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      router.push(`/result/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm">🔍</div>
        <span className="font-bold text-lg tracking-tight">SpinScope</span>
        <span className="text-white/30 text-sm">— מה שהכתבה לא אמרה לך</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-orange-400 text-sm bg-orange-400/10 border border-orange-400/20 rounded-full px-4 py-1.5 mb-2">
            <span>⚡</span>
            <span>ניתוח כתבות עם AI</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            גלה את הספין<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              לפני שאתה משתף
            </span>
          </h1>

          <p className="text-white/50 text-lg max-w-lg mx-auto">
            הדבק כתובת URL או טקסט של כתבה. SpinScope מנתח את הנרטיב, מה חסר, ומה כתבות אחרות אומרות על אותו אירוע.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 mt-8">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="הדבק URL של כתבה או את הטקסט עצמו..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/25 outline-none focus:border-orange-500/50 transition-all resize-none text-sm"
              dir="auto"
            />
            {error && <p className="text-red-400 text-sm text-right">⚠️ {error}</p>}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-gradient-to-r from-orange-500 to-red-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span> מנתח את הכתבה...
                </span>
              ) : "🔍 נתח את הכתבה"}
            </button>
          </form>

          <p className="text-white/20 text-xs">SpinScope לא שומר כתבות. הניתוח נמחק תוך 24 שעות.</p>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-6">
        <p className="text-center text-white/25 text-xs mb-4">דוגמאות לאתרים שתוכל לנתח</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {["ynet.co.il", "haaretz.co.il", "mako.co.il", "walla.co.il", "kan.org.il", "n12.co.il"].map(s => (
            <span key={s} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/40">{s}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
