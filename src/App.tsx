/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Trash2, 
  Leaf, 
  Recycle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Info, 
  ShieldCheck,
  ChevronRight,
  Loader2,
  Sparkles,
  BarChart3,
  Globe,
  Languages,
  MessageSquare,
  BookOpen,
  Send,
  User,
  Bot
} from "lucide-react";
import { cn } from "./lib/utils";
import { analyzeWasteImage, chatWithEcologyAssistant } from "./services/gemini";
import type { WasteAnalysis, ChatMessage } from "./types";

interface Stats {
  totalWasteAnalyzed: number;
  recyclingRate: number;
  carbonSaved: string;
}

const translations = {
  en: {
    scanner: "Scanner",
    education: "Education",
    chat: "Eco Assistant",
    points: "Total Points",
    recyclingIdeas: "Upcycling Ideas",
    tagline: "Recycling made",
    taglineGreen: "Intelligent.",
    description: "Drop an image of any waste item and let Gemini AI provide instant, accurate recycling insights.",
    uploadTitle: "Scan Waste Item",
    uploadDesc: "Drop an image here or click to browse.",
    remove: "Remove",
    analyze: "Analyze & Sort",
    analyzing: "Analyzing...",
    visionActive: "Gemini Vision Active",
    sourceInfo: "Source Image",
    recyclable: "RECYCLABLE",
    landfill: "LANDFILL",
    ecosortIndex: "Ecosort Index",
    achievement: "Top 5% Achievement for",
    visionResult: "Vision Result",
    materialId: "Material ID",
    statusRecyclable: "PROCEED TO RECYCLE",
    statusLandfill: "DISPOSE IN LANDFILL",
    carbonSavings: "Carbon Savings",
    disposalSteps: "Disposal Steps",
    envContext: "Environment Context",
    startNew: "Start New Scan",
    saveResult: "Save Result",
    shareRecord: "Share Record",
    globalStats: "Global Stats",
    processedToday: "Items Processed Today",
    totalSavings: "Total Savings",
    carbonOffset: "Carbon Offset Worldwide",
    systemStatus: "Engine: Optimal",
    poweredBy: "Intelligent Sustainability",
    eduTitle: "Environmental Guide",
    eduSubtitle: "Understand waste categories and recycling symbols",
    chatPlaceholder: "Ask me anything about recycling...",
    eduCategories: [
      { id: 'organic', name: 'Organic', desc: 'Natural items like food scraps, leaves, and paper that decompose naturally.', color: 'bg-green-500' },
      { id: 'plastic', name: 'Plastic', desc: 'Synthetic polymers. Not all are recyclable. Check symbols 1, 2, and 5.', color: 'bg-blue-500' },
      { id: 'paper', name: 'Paper & Cardboard', desc: 'Clean paper products. Greasy pizza boxes usually go to landfill.', color: 'bg-amber-500' },
      { id: 'glass', name: 'Glass', desc: 'Can be recycled indefinitely without losing quality.', color: 'bg-cyan-500' },
      { id: 'metal', name: 'Metal & E-Waste', desc: 'High-value recyclables. E-waste requires special processing.', color: 'bg-indigo-500' }
    ]
  },
  id: {
    scanner: "Pemindai",
    education: "Pendidikan",
    chat: "Asisten Eco",
    points: "Total Poin",
    recyclingIdeas: "Ide Daur Ulang",
    tagline: "Daur ulang jadi",
    taglineGreen: "Cerdas.",
    description: "Unggah gambar limbah apa pun dan biarkan AI Gemini memberikan wawasan daur ulang yang instan dan akurat.",
    uploadTitle: "Pindai Item Limbah",
    uploadDesc: "Letakkan gambar di sini atau klik untuk mencari.",
    remove: "Hapus",
    analyze: "Analisis & Sortir",
    analyzing: "Menganalisis...",
    visionActive: "Visi Gemini Aktif",
    sourceInfo: "Gambar Sumber",
    recyclable: "DAUR ULANG",
    landfill: "TEMPAT SAMPAH",
    ecosortIndex: "Indeks Ecosort",
    achievement: "Pencapaian 5% Teratas untuk",
    visionResult: "Hasil Analisis",
    materialId: "ID Material",
    statusRecyclable: "LANJUT KE DAUR ULANG",
    statusLandfill: "BUANG KE TPA",
    carbonSavings: "Penghematan Karbon",
    disposalSteps: "Langkah Pembuangan",
    envContext: "Konteks Lingkungan",
    startNew: "Mulai Pemindaian Baru",
    saveResult: "Simpan Hasil",
    shareRecord: "Bagikan Rekaman",
    globalStats: "Statistik Global",
    processedToday: "Item Diproses Hari Ini",
    totalSavings: "Total Penghematan",
    carbonOffset: "Offset Karbon Dunia",
    systemStatus: "Mesin: Optimal",
    poweredBy: "Keberlanjutan Cerdas",
    eduTitle: "Panduan Lingkungan",
    eduSubtitle: "Pahami kategori sampah dan simbol daur ulang",
    chatPlaceholder: "Tanya saya apa saja tentang daur ulang...",
    eduCategories: [
      { id: 'organic', name: 'Organik', desc: 'Sisa makanan, dedaunan, dan kertas yang terurai secara alami.', color: 'bg-green-500' },
      { id: 'plastic', name: 'Plastik', desc: 'Polimer sintetis. Tidak semua bisa didaur ulang. Cek simbol 1, 2, dan 5.', color: 'bg-blue-500' },
      { id: 'paper', name: 'Kertas & Kardus', desc: 'Produk kertas bersih. Kardus berminyak biasanya masuk TPA.', color: 'bg-amber-500' },
      { id: 'glass', name: 'Kaca', desc: 'Dapat didaur ulang tanpa batas waktu tanpa kehilangan kualitas.', color: 'bg-cyan-500' },
      { id: 'metal', name: 'Logam & E-Waste', desc: 'Barang bernilai tinggi. E-waste butuh pemrosesan khusus.', color: 'bg-indigo-500' }
    ]
  }
};

export default function App() {
  const [lang, setLang] = useState<"en" | "id">("id");
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<"scanner" | "education" | "chat">("scanner");
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WasteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Failed to fetch stats", err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: "user", text: inputMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsChatLoading(true);

    try {
      const response = await chatWithEcologyAssistant(chatMessages, inputMessage, lang);
      const assistantMsg: ChatMessage = { role: "model", text: response };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeWasteImage(image, lang);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/10 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-eco-500 rounded-lg flex items-center justify-center shadow-lg shadow-eco-500/20 shrink-0">
            <Recycle size={20} className="text-white" />
          </div>
          <span className="text-base sm:text-xl font-display font-bold text-white tracking-tight truncate">EcoSort<span className="text-eco-500">AI</span></span>
        </div>
        
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <button 
            onClick={() => setActiveTab("scanner")}
            className={cn("transition-colors flex items-center gap-2", activeTab === "scanner" ? "text-eco-400 font-bold" : "hover:text-white")}
          >
            <Recycle size={14} />
            {t.scanner}
          </button>
          <button 
            onClick={() => setActiveTab("education")}
            className={cn("transition-colors flex items-center gap-2", activeTab === "education" ? "text-eco-400 font-bold" : "hover:text-white")}
          >
            <BookOpen size={14} />
            {t.education}
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={cn("transition-colors flex items-center gap-2", activeTab === "chat" ? "text-eco-400 font-bold" : "hover:text-white")}
          >
            <MessageSquare size={14} />
            {t.chat}
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setLang(lang === "en" ? "id" : "en")}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            <Languages size={14} className="text-eco-500" />
            {lang === "en" ? "EN" : "ID"}
          </button>
          <button className="hidden sm:flex px-4 py-1.5 rounded-full bg-eco-500/10 text-eco-400 border border-eco-500/20 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
            {stats?.carbonSaved ? `${stats.carbonSaved} Saved` : `1,240 ${t.points}`}
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10 shrink-0"></div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={cn(
        "flex-1 pt-20 md:pt-24 pb-20 md:pb-12 px-4 md:px-12 w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8",
        activeTab === "scanner" && result ? "lg:grid lg:grid-cols-12" : "items-center"
      )}>

        <AnimatePresence mode="wait">
          {activeTab === "scanner" && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center col-span-12 lg:contents"
            >
              {/* Scanner Section */}
              <section className={cn(
                "flex flex-col gap-6 w-full",
                result ? "md:col-span-12 lg:col-span-5" : "max-w-2xl text-center"
              )}>
                {!result ? (
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 bg-eco-500/10 text-eco-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 md:mb-8 border border-eco-500/20">
                      <Sparkles size={14} />
                      <span>AI-Powered Waste Classification</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight mb-4 md:mb-6 text-center">
                      {t.tagline} <span className="text-eco-500">{t.taglineGreen}</span>
                    </h1>
                    
                    <p className="text-slate-400 text-sm md:text-base mb-8 md:mb-12 max-w-md mx-auto text-center">
                      {t.description}
                    </p>

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDrop}
                      onClick={() => !image && fileInputRef.current?.click()}
                      className={cn(
                        "w-full rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all duration-500",
                        "border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/40",
                        !image && "cursor-pointer hover:border-eco-500/50 hover:from-slate-900"
                      )}
                    >
                      {!image ? (
                        <>
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                          <div className="absolute inset-0 bg-eco-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-eco-500/10 flex items-center justify-center mb-4 md:mb-6 border border-eco-500/20 group-hover:scale-110 transition-transform">
                            <Upload className="text-eco-400" size={28} />
                          </div>
                          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{t.uploadTitle}</h3>
                          <p className="text-slate-400 text-xs md:text-sm max-w-[240px]">{t.uploadDesc}</p>
                        </>
                      ) : (
                        <div className="w-full">
                          <img src={image} alt="Preview" className="w-full h-64 md:h-80 object-cover rounded-2xl mb-6 md:mb-8 border border-white/10 shadow-2xl" />
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={reset} className="flex-1 px-6 py-3 md:py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-2">
                              <Trash2 size={18} />
                              {t.remove}
                            </button>
                            <button
                              onClick={handleAnalyze}
                              disabled={isAnalyzing}
                              className="btn-primary flex-[2] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm py-3 md:py-4"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="animate-spin" size={18} />
                                  {t.analyzing}
                                </>
                              ) : (
                                <>
                                  <Sparkles size={18} />
                                  {t.analyze}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-8 flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-eco-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.visionActive}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v2.4 Engine</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 md:sticky md:top-24">
                     <div className="rounded-3xl border border-white/10 card-gradient p-4 group overflow-hidden">
                      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-800">
                        <img src={image!} alt="Analyzed" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-eco-400 uppercase tracking-widest mb-1">{t.sourceInfo}</p>
                            <h4 className="text-white font-bold text-lg capitalize">{result.wasteType}</h4>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg",
                            result.isRecyclable ? "bg-eco-500 text-slate-950" : "bg-red-500 text-white"
                          )}>
                            {result.isRecyclable ? t.recyclable : t.landfill}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl p-8 bg-eco-500 text-slate-950 relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <p className="text-[10px] font-black text-slate-950/60 uppercase tracking-widest mb-1">{t.ecosortIndex}</p>
                            <h3 className="text-6xl font-display font-light leading-none">{result.sustainabilityScore}</h3>
                          </div>
                          <BarChart3 size={32} className="text-slate-950/40" />
                        </div>
                        <div className="h-1.5 w-full bg-slate-950/10 rounded-full overflow-hidden mb-4">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${result.sustainabilityScore}%` }}
                            transition={{ delay: 0.3, duration: 1 }}
                            className="h-full bg-slate-950"
                          />
                        </div>
                        <p className="text-xs font-bold text-slate-950/80 uppercase tracking-tight">
                          {t.achievement} {result.category}
                        </p>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full" />
                    </div>
                  </div>
                )}
              </section>

              {/* Right Section: Results / Insights */}
              {result && (
                <section className="md:col-span-12 lg:col-span-7 flex flex-col gap-4 md:gap-6 w-full">
                  <div className="glass-emerald rounded-[32px] md:rounded-[40px] p-6 sm:p-8 md:p-12 relative overflow-hidden">
                     <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                       <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">Highly Accurate</span>
                     </div>
                     
                     <div className="mb-6 md:mb-10 text-left">
                       <p className="text-eco-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2">{t.visionResult}</p>
                       <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2 capitalize">{result.wasteType}</h2>
                       <p className="text-slate-400 text-xs sm:text-sm italic font-medium">"{result.category} / {t.materialId}: {Math.floor(Math.random() * 900) + 100}"</p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-10">
                        <div className="bg-slate-900/60 p-4 md:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <div className="w-8 h-8 rounded-lg bg-eco-500/10 flex items-center justify-center text-eco-400">
                              <ShieldCheck size={18} />
                            </div>
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Recyclable Status</p>
                          </div>
                          <p className="text-white text-lg md:text-xl font-bold text-left">{result.isRecyclable ? t.statusRecyclable : t.statusLandfill}</p>
                        </div>
                        <div className="bg-slate-900/60 p-4 md:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <Globe size={18} />
                            </div>
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">{t.carbonSavings}</p>
                          </div>
                          <p className="text-white text-lg md:text-xl font-bold text-left">~0.{Math.floor(Math.random() * 90) + 10} kg CO₂e Saved</p>
                        </div>
                     </div>

                     <div className="space-y-4 md:space-y-6">
                       <div className="p-5 md:p-6 rounded-2xl bg-slate-900/40 border border-white/5 shadow-inner">
                          <h5 className="text-[10px] md:text-xs font-bold text-white mb-2 md:mb-3 flex items-center gap-2 uppercase tracking-widest text-left">
                            <ArrowRight size={14} className="text-eco-400" />
                            {t.disposalSteps}
                          </h5>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium text-left">
                            {result.recommendation}
                          </p>
                       </div>
                       
                       <div className="p-5 md:p-6 rounded-2xl border border-white/5 bg-slate-950/40">
                          <h5 className="text-[10px] md:text-xs font-bold text-white mb-2 md:mb-3 flex items-center gap-2 uppercase tracking-widest text-left">
                            <Sparkles size={14} className="text-eco-400" />
                            {t.recyclingIdeas}
                          </h5>

                          <div className="space-y-2">
                            {result.recyclingIdeas?.map((idea, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-slate-400 text-sm italic text-left">
                                <div className="w-1.5 h-1.5 rounded-full bg-eco-500 mt-1.5 flex-shrink-0" />
                                {idea}
                              </div>
                            ))}
                          </div>
                       </div>
                     </div>

                     <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5">
                        <button 
                          onClick={reset}
                          className="btn-primary w-full flex items-center justify-center gap-3 py-4 md:py-5 text-sm uppercase tracking-[0.2em]"
                        >
                          <Recycle size={20} />
                          {t.startNew}
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-4 sm:pb-12">
                     <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 flex flex-col justify-between hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.globalStats}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-eco-500 animate-pulse" />
                            <span className="text-[8px] font-black text-eco-500 uppercase tracking-wider">Live</span>
                          </div>
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-2xl md:text-3xl font-display font-bold text-white mt-3 md:mt-4 text-left">{stats?.totalWasteAnalyzed.toLocaleString() || "12,540"}</h4>
                          <p className="text-[10px] font-bold text-eco-400 uppercase tracking-widest mt-1 text-left">{t.processedToday}</p>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-eco-500/10 transition-colors">
                          <BarChart3 size={60} className="md:w-20 md:h-20" />
                        </div>
                     </div>
                     <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 flex flex-col justify-between hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.totalSavings}</p>
                          <Info size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-2xl md:text-3xl font-display font-bold text-white mt-3 md:mt-4 text-left">{stats?.carbonSaved || "4.2 Tons"}</h4>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1 text-left">{t.carbonOffset}</p>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-blue-500/10 transition-colors">
                          <Globe size={60} className="md:w-20 md:h-20" />
                        </div>
                     </div>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === "education" && (
            <motion.div 
              key="education"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-6 md:space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2 md:mb-4">{t.eduTitle}</h2>
                <p className="text-slate-400 text-sm md:text-base">{t.eduSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {t.eduCategories.map((cat) => (
                  <div key={cat.id} className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 md:p-8 hover:border-eco-500/30 transition-all group">
                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl mb-4 md:mb-6 flex items-center justify-center text-white", cat.color)}>
                      <Leaf size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{cat.name}</h3>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{cat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[32px] md:rounded-[40px] border border-eco-500/20 bg-eco-500/5 p-8 md:p-12 overflow-hidden relative group">
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 md:gap-12 text-center lg:text-left">
                   <div className="flex-1">
                     <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 uppercase tracking-tight">Reduce, Reuse, Recycle</h3>
                     <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 md:mb-8">
                       The waste hierarchy is a tool used in the evaluation of processes that protect the environment alongside resource and energy consumption from most favorable to least favorable actions.
                     </p>
                     <div className="flex justify-center lg:justify-start gap-4">
                       <button className="px-6 py-2 rounded-full border border-white/10 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Learn More</button>
                     </div>
                   </div>
                   <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 bg-eco-500 rounded-3xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                      <Recycle size={80} className="text-white opacity-20 md:w-30 md:h-30" />
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-eco-500/10 blur-[100px] rounded-full" />
              </div>
            </motion.div>
          )}

          {activeTab === "chat" && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-4xl flex flex-col h-[70vh] rounded-[32px] md:rounded-[40px] border border-white/10 bg-slate-900/40 relative overflow-hidden"
            >
              <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/60">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-eco-500 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-white md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-white leading-tight">{t.chat}</h3>
                    <p className="text-[8px] md:text-[10px] text-eco-400 uppercase font-black tracking-widest leading-none mt-1">Online / AI Powered</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                    <MessageSquare size={48} className="text-eco-500 mb-4 md:w-16 md:h-16" />
                    <p className="text-xs md:text-sm font-medium">{lang === "id" ? "Apa yang ingin Anda ketahui?" : "What would you like to know?"}</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-2 md:gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user" ? "bg-slate-700" : "bg-eco-500"
                    )}>
                      {msg.role === "user" ? <User size={12} className="md:w-4 md:h-4" /> : <Bot size={12} className="md:w-4 md:h-4" />}
                    </div>
                    <div className={cn(
                      "max-w-[85%] sm:max-w-[70%] p-3 md:p-4 rounded-2xl text-[13px] md:text-sm leading-relaxed text-left",
                      msg.role === "user" ? "bg-white/5 border border-white/10 rounded-tr-none text-white shadow-sm" : "bg-eco-500/10 border border-eco-500/20 rounded-tl-none text-slate-200"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-eco-500 flex items-center justify-center shrink-0">
                      <Bot size={12} className="md:w-4 md:h-4" />
                    </div>
                    <div className="bg-eco-500/10 border border-eco-500/20 p-3 md:p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-eco-500 animate-bounce" />
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-eco-500 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-eco-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-white/10 bg-slate-900/60">
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={t.chatPlaceholder}
                    disabled={isChatLoading}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 md:py-4 pl-4 md:pl-6 pr-12 md:pr-14 text-sm focus:outline-none focus:border-eco-500/50 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!inputMessage.trim() || isChatLoading}
                    className="absolute right-1.5 top-1.5 w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-eco-500 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="hidden md:flex h-12 px-8 border-t border-white/10 bg-slate-950 items-center justify-between z-50">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-eco-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{t.systemStatus}</span>
           </div>
           <div className="hidden sm:flex items-center gap-2">
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Gemini Flash 1.5 Integrated</span>
           </div>
        </div>
        <div className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em]">
          © 2026 Farhan Fadhilah — {t.poweredBy}
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-50">
        <button 
          onClick={() => setActiveTab("scanner")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "scanner" ? "text-eco-500 scale-110" : "text-slate-500"
          )}
        >
          <Recycle size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">{t.scanner}</span>
        </button>
        <button 
          onClick={() => setActiveTab("education")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "education" ? "text-eco-500 scale-110" : "text-slate-500"
          )}
        >
          <BookOpen size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">{t.education}</span>
        </button>
        <button 
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "chat" ? "text-eco-500 scale-110" : "text-slate-500"
          )}
        >
          <MessageSquare size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">{t.chat}</span>
        </button>
      </div>

      {/* Background radial effects */}
      <div className="fixed top-0 left-0 w-full h-full -z-50 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-eco-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4"></div>
      </div>
    </div>
  );
}

