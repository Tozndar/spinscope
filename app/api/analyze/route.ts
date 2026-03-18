import { saveResult, type AnalysisResult } from "@/lib/store";
import { randomUUID } from "crypto";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function fetchArticleText(input: string): Promise<{ title: string; text: string; source: string }> {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const res = await fetch(input, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SpinScope/1.0)" },
    });
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s*[-|–].*$/, "").trim() : "כתבה";
    const url = new URL(input);
    const source = url.hostname.replace("www.", "");

    const paragraphs = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];

    const text = paragraphs
      .map((p) => p.replace(/<[^>]+>/g, "").trim())
      .filter((p) => p.length > 30)
      .slice(0, 25)
      .join("\n\n");

    return { title, text: text || "לא ניתן לחלץ טקסט", source };
  }

  const firstLine = input.split("\n")[0].slice(0, 80);
  return { title: firstLine, text: input, source: "טקסט ידני" };
}

async function analyzeWithGemini(articleTitle: string, articleText: string): Promise<any> {
  const prompt = `אתה עורך עיתונות ביקורתי וחוקר מדיה מנוסה.

נתח את הכתבה הבאה וזהה את הספין:

כותרת: ${articleTitle}
תוכן:
${articleText.slice(0, 4000)}

ענה ב-JSON בלבד (בעברית):
{
  "level": "נמוך" או "בינוני" או "גבוה",
  "summary": "משפט אחד: מה הספין המרכזי",
  "whatEmphasized": "מה הכתבה מדגישה ומגדילה",
  "whatMissing": "מה חסר או מוסתר",
  "whoBenefits": "מי נהנה מהפריימינג הזה",
  "framing": "המסגרת הרגשית: פחד/גאווה/כעס/אשמה/ניטרלי",
  "verdict": "פסיקה חריפה וחכמה של 1-2 משפטים",
  "searchQuery": "שאילתת חיפוש קצרה בעברית למציאת כתבות קשורות"
}

JSON בלבד, ללא markdown.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
      }),
    }
  );

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned); } catch { return {}; }
}

async function searchRelated(query: string): Promise<{ title: string; url: string; source: string }[]> {
  // Use Google's custom search or fallback
  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GEMINI_API_KEY}&cx=a0ef49719dcb64de9&q=${encodeURIComponent(query)}&num=4&lr=lang_he`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).slice(0, 4).map((item: any) => ({
      title: item.title,
      url: item.link,
      source: new URL(item.link).hostname.replace("www.", ""),
    }));
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const { input } = await req.json();
  if (!input) return Response.json({ error: "חסר קלט" }, { status: 400 });
  if (!GEMINI_API_KEY) return Response.json({ error: "API key חסר" }, { status: 500 });

  try {
    const { title, text, source } = await fetchArticleText(input);
    const analysis = await analyzeWithGemini(title, text);

    const related = await searchRelated(analysis.searchQuery || title);

    const id = randomUUID().split("-")[0];
    const result: AnalysisResult = {
      id,
      createdAt: Date.now(),
      articleTitle: title,
      articleSource: source,
      articleText: text.slice(0, 500),
      spin: {
        level: analysis.level || "בינוני",
        summary: analysis.summary || "",
        whatEmphasized: analysis.whatEmphasized || "",
        whatMissing: analysis.whatMissing || "",
        whoBenefits: analysis.whoBenefits || "",
        framing: analysis.framing || "",
      },
      relatedArticles: related,
      verdict: analysis.verdict || "",
    };

    saveResult(result);
    return Response.json({ id });
  } catch (err: any) {
    console.error("analyze error:", err);
    return Response.json({ error: err.message || "שגיאה בניתוח" }, { status: 500 });
  }
}
