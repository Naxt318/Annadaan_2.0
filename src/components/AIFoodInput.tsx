import { useState, useRef } from "react";
import { Sparkles, Mic, MicOff, Loader2, Wand2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ParsedFood {
  foodType: string;
  quantity: string;
  unit: "kg" | "portions" | "packets";
  expiryDate: string;
  location: string;
  notes: string;
}

interface AIFoodInputProps {
  onParsed: (data: ParsedFood) => void;
}

function getTodayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Handles ANY casual paragraph — not just structured inputs
async function parseAnything(text: string): Promise<ParsedFood> {
  const today = getTodayPlus(0);
  const tomorrow = getTodayPlus(1);

  const systemPrompt = `You are an expert at extracting food donation details from casual, unstructured messages for Annadaan — a food donation app in Mumbai, India.

The user might write anything — a paragraph, broken English, Hindi-English mix, very vague, or very detailed. Your job is to make the BEST possible guess from whatever they write.

Return ONLY a raw JSON object. No markdown, no backticks, no explanation — just pure JSON starting with { and ending with }.

JSON structure:
{
  "foodType": "string — descriptive food name. If vague like 'food' or 'stuff', use 'Cooked Food'. Be descriptive.",
  "quantity": "string — just the number e.g. '25'. If not mentioned, estimate based on context (e.g. 'feeding 100 people' = '100', 'large pot' = '10'). Default '10'.",
  "unit": "kg OR portions OR packets — choose best fit. Cooked meals = portions, loose items = kg, sealed = packets",
  "expiryDate": "YYYY-MM-DD — today=${today} tomorrow=${tomorrow}. 'tonight'/'today' = ${today}. 'tomorrow' = ${tomorrow}. Not mentioned = ${tomorrow}. 'this week' = ${getTodayPlus(3)}",
  "location": "pickup location. If a Mumbai area is mentioned use 'Area, Mumbai'. Otherwise 'Mumbai'",
  "notes": "any useful context — pickup time, dietary info (veg/non-veg), freshness, occasion like wedding/event. Empty string if nothing."
}

Examples of vague inputs and good responses:
- "mere paas bohot sara khana hai jo aaj raat expire ho jayega andheri mein" → foodType:"Cooked Food", quantity:"10", unit:"portions", expiryDate:"${today}", location:"Andheri, Mumbai"
- "we had a big party yesterday and have leftover food for around 50 people" → foodType:"Party Leftover Food", quantity:"50", unit:"portions", expiryDate:"${today}", notes:"Party leftover, distribute soon"
- "bakery closing, 200 breads going to waste" → foodType:"Bread", quantity:"200", unit:"packets", expiryDate:"${today}"
- "I want to donate" → foodType:"Cooked Food", quantity:"10", unit:"portions", expiryDate:"${tomorrow}", location:"Mumbai", notes:""

Always return all 6 fields. Never return null or undefined values.`;

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
            parts: [{ text: systemPrompt + "\n\nUser message:\n" + text }],
          },
        ],
        generationConfig: { maxOutputTokens: 400, temperature: 0.1 },
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API ${response.status}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract JSON even if model added any surrounding text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON returned");

  const parsed: ParsedFood = JSON.parse(jsonMatch[0]);

  // Sanitize — ensure valid unit
  if (!["kg", "portions", "packets"].includes(parsed.unit)) parsed.unit = "portions";
  // Ensure quantity is a valid number string
  if (!parsed.quantity || isNaN(Number(parsed.quantity))) parsed.quantity = "10";
  // Ensure expiry is a valid date
  if (!parsed.expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.expiryDate)) parsed.expiryDate = tomorrow;
  // Ensure foodType is not empty
  if (!parsed.foodType?.trim()) parsed.foodType = "Cooked Food";
  // Ensure location
  if (!parsed.location?.trim()) parsed.location = "Mumbai";

  return parsed;
}

export function AIFoodInput({ onParsed }: AIFoodInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [show, setShow] = useState(false);
  const [lastParsed, setLastParsed] = useState<ParsedFood | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported — use Chrome"); return; }
    const r = new SR();
    r.lang = "en-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => {
      setText((p) => p + (p ? " " : "") + e.results[0][0].transcript);
      setListening(false);
    };
    r.onerror = () => { setListening(false); toast.error("Voice failed, try again"); };
    r.onend = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const handleParse = async () => {
    if (!text.trim()) { toast.error("Write something first!"); return; }
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "your_gemini_api_key_here") {
      toast.error("Gemini API key not set — add VITE_GEMINI_API_KEY to your .env file");
      return;
    }
    setLoading(true);
    try {
      const parsed = await parseAnything(text);
      setLastParsed(parsed);
      onParsed(parsed);
      setText("");
      setShow(false);
      toast.success("Form filled! Review the details and submit.");
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("API_KEY") || err?.message?.includes("403") || err?.message?.includes("400")) {
        toast.error("Invalid Gemini API key — check VITE_GEMINI_API_KEY in .env");
      } else if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
        toast.error("Network error — check your internet connection and try again");
      } else {
        toast.error(`AI parse failed: ${err?.message || "Unknown error"} — try again`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Example prompts — intentionally vague/casual to show AI power
  const examples = [
    "Mere paas aaj ka bacha hua khana hai Bandra mein, around 30 log kha sakte hain",
    "We had a wedding yesterday, loads of biryani and sweets leftover, please take ASAP",
    "Bakery closing early today, 80 loaves going to waste, Dadar West",
    "I have food I want to donate tonight",
  ];

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
      >
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Wand2 className="w-3.5 h-3.5" />
        </div>
        {show ? "Hide AI input" : "Just describe your donation — AI fills the form"}
        <span className="text-xs text-muted-foreground font-normal">(any language, any format)</span>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-3"
          >
            <div className="bg-gradient-to-br from-primary/5 via-background to-amber-50/40 border border-primary/20 rounded-2xl p-4">

              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Tell AI about your food</p>
                <span className="ml-auto text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Hindi • English • Hinglish ✓
                </span>
              </div>

              {/* Textarea + mic */}
              <div className="relative">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse(); }}
                  placeholder="Write anything... e.g. 'Aaj function tha, bahut khana bacha hai Andheri mein, aaj raat tak expire ho jayega' or 'We have leftover rice and curry from our office event for around 40 people'"
                  className="resize-none pr-12 bg-white/80 text-sm leading-relaxed min-h-[80px]"
                  rows={3}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  disabled={loading}
                  className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${
                    listening
                      ? "bg-red-100 text-red-500 scale-110 ring-2 ring-red-300"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={listening ? "Stop listening" : "Speak your donation"}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {listening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  Listening… speak in any language
                </motion.p>
              )}

              {/* Example prompts */}
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Try these examples</p>
                <div className="flex flex-col gap-1.5">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setText(ex)}
                      disabled={loading}
                      className="text-left text-xs bg-white/70 border border-border/60 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-white transition-all truncate"
                    >
                      "{ex}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-3 mt-4">
                <Button
                  type="button"
                  onClick={handleParse}
                  disabled={loading || !text.trim()}
                  className="gap-2 flex-1 sm:flex-none"
                  size="sm"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Understanding…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Fill Form with AI</>
                  )}
                </Button>

                {lastParsed && !loading && (
                  <button
                    type="button"
                    onClick={() => { onParsed(lastParsed); toast.success("Re-applied last parse"); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-apply last
                  </button>
                )}

                <span className="text-xs text-muted-foreground ml-auto hidden sm:block">Ctrl+Enter</span>
              </div>

              <p className="text-[11px] text-muted-foreground/60 mt-2.5 leading-relaxed">
                AI will make its best guess from anything you write. You can edit the filled form before submitting.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}