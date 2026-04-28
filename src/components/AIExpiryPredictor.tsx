import { useState } from "react";
import { Brain, Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AIExpiryPredictorProps {
  foodType: string;
  expiryDate: string;
  notes?: string;
  onSuggestExpiry?: (date: string) => void;
}

interface Prediction {
  safeToDistribute: boolean;
  urgencyTag: "critical" | "high" | "medium" | "low";
  urgencyLabel: string;
  estimatedSafeHours: number;
  reasoning: string;
  recommendation: string;
  suggestedExpiry?: string;
}

const URGENCY_STYLES: Record<Prediction["urgencyTag"], { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  critical: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: <Clock className="w-4 h-4 text-amber-500" />,
  },
  low: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  },
};

const SYSTEM_PROMPT = `You are a food safety AI for Annadaan, a food donation platform in Mumbai, India.
Given food details, predict expiry safety and assign an urgency tag.
Respond ONLY with a JSON object, no markdown, no extra text.
Fields:
- safeToDistribute: boolean
- urgencyTag: "critical" | "high" | "medium" | "low"
  critical = expires within 3 hours or already expired
  high = expires within 24 hours
  medium = expires within 3 days
  low = safe for 3+ days
- urgencyLabel: short human label e.g. "Expires in 2 hours — critical"
- estimatedSafeHours: number (how many hours the food is safe to distribute)
- reasoning: 1-2 sentence explanation
- recommendation: 1 sentence action recommendation for the NGO/volunteer
- suggestedExpiry: ISO date YYYY-MM-DD if the stated expiry seems wrong/missing, else omit this field

Consider: Indian climate (Mumbai = hot+humid), food type, cooking method clues in notes.
Today: ${new Date().toISOString()}`;

export function AIExpiryPredictor({ foodType, expiryDate, notes, onSuggestExpiry }: AIExpiryPredictorProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const predict = async () => {
    if (!foodType) return;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "your_gemini_api_key_here") {
      setShow(false);
      return;
    }
    setLoading(true);
    setShow(true);
    try {
      const userMsg = `Food: ${foodType}\nExpiry date stated: ${expiryDate || "not specified"}\nNotes: ${notes || "none"}`;
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT + "\n\nFood details:\n" + userMsg }],
              },
            ],
            generationConfig: { maxOutputTokens: 1000, temperature: 0.1 },
          }),
        }
      );
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      setPrediction(JSON.parse(clean));
    } catch {
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  if (!foodType) return null;

  const style = prediction ? URGENCY_STYLES[prediction.urgencyTag] : null;

  return (
    <div className="mt-2">
      {!show && (
        <Button type="button" variant="ghost" size="sm" onClick={predict} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
          <Brain className="w-3 h-3" /> AI Expiry Check
        </Button>
      )}

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 p-3 bg-muted/30 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analysing food safety…
              </div>
            ) : prediction && style ? (
              <div className={`mt-2 p-3 rounded-xl border ${style.bg} ${style.border}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {style.icon}
                    <span className={`text-xs font-semibold ${style.text}`}>{prediction.urgencyLabel}</span>
                  </div>
                  <button type="button" onClick={() => { setShow(false); setPrediction(null); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
                <p className={`text-xs ${style.text} opacity-80 leading-snug`}>{prediction.reasoning}</p>
                <p className={`text-xs font-medium ${style.text} mt-1`}>→ {prediction.recommendation}</p>
                {prediction.suggestedExpiry && onSuggestExpiry && (
                  <button
                    type="button"
                    onClick={() => onSuggestExpiry(prediction.suggestedExpiry!)}
                    className="mt-1.5 text-xs underline text-primary hover:text-primary/80"
                  >
                    Use AI suggested date: {prediction.suggestedExpiry}
                  </button>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}