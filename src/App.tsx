/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  ClipboardCheck, 
  Settings, 
  Play, 
  Download, 
  Save, 
  Languages, 
  Palette,
  Terminal,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Users
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend
} from 'recharts';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { AppState, Language, Entity, WorkflowResults } from './types';
import { DEFAULT_TEMPLATE, PAINTER_STYLES, DICT } from './constants';
import { runWorkflow } from './services/geminiService';

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className={cn("p-6 rounded-2xl border border-white/10 backdrop-blur-md bg-white/5 flex items-center gap-4", color)}>
    <div className="p-3 rounded-xl bg-white/10">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wider opacity-60">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const LiveLogs = ({ logs }: { logs: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs h-40 overflow-y-auto" ref={scrollRef}>
      <div className="flex items-center gap-2 mb-2 text-emerald-400">
        <Terminal className="w-4 h-4" />
        <span>LIVE AGENT STREAM</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="mb-1 opacity-80">
          <span className="text-white/40 mr-2">[{new Date().toLocaleTimeString()}]</span>
          {log}
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>({
    submissionSummary: '',
    reviewNotes: '',
    reviewGuidance: '',
    reportTemplate: DEFAULT_TEMPLATE,
    language: 'zh',
    agentStep: 0,
    results: {},
    isProcessing: false,
    styleId: 'modern',
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'submission' | 'dataset' | 'results'>('dashboard');
  const [logs, setLogs] = useState<string[]>(["System initialized. Ready for submission."]);
  const [localEntities, setLocalEntities] = useState<Entity[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const t = DICT[state.language];

  const handleStopAgent = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLogs(prev => [...prev, "Workflow stopped by user."]);
      setState(prev => ({ ...prev, isProcessing: false, agentStep: 0 }));
    }
  };

  const handleStartAgent = async () => {
    if (!state.submissionSummary) {
      alert("Please provide a submission summary.");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({ ...prev, isProcessing: true, agentStep: 1 }));
    setLogs(prev => [...prev, "Initiating multi-agent workflow..."]);

    try {
      const results = await runWorkflow({
        summary: state.submissionSummary,
        notes: state.reviewNotes,
        guidance: state.reviewGuidance,
        template: state.reportTemplate,
        language: state.language,
      }, (step, log) => {
        setState(prev => ({ ...prev, agentStep: step as any }));
        setLogs(prev => [...prev, log]);
      }, controller.signal);

      setState(prev => ({ ...prev, results, isProcessing: false, agentStep: 0 }));
      setLocalEntities(results.dataset || []);
      setActiveTab('results');
    } catch (error: any) {
      if (error.message === "Workflow stopped by user.") {
        console.log("Workflow aborted");
      } else {
        console.error(error);
        setLogs(prev => [...prev, "ERROR: Workflow failed. Check console for details."]);
      }
      setState(prev => ({ ...prev, isProcessing: false, agentStep: 0 }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const getStyleClasses = () => {
    const style = PAINTER_STYLES.find(s => s.id === state.styleId) || PAINTER_STYLES[0];
    let decorators = "";
    
    switch (state.styleId) {
      case 'van-gogh':
        decorators = "font-serif [background-image:url('https://www.transparenttextures.com/patterns/oil-canvas.png')]";
        break;
      case 'picasso':
        decorators = "[&_*]:rounded-none border-4 border-black";
        break;
      case 'monet':
        decorators = "font-serif blur-[0.3px] [background-image:url('https://www.transparenttextures.com/patterns/paper-fibers.png')]";
        break;
      case 'banksy':
        decorators = "font-mono uppercase tracking-tighter [background-image:url('https://www.transparenttextures.com/patterns/stucco.png')]";
        break;
      case 'warhol':
        decorators = "contrast-125 saturate-150";
        break;
      case 'klimt':
        decorators = "font-serif [background-image:url('https://www.transparenttextures.com/patterns/gold-scale.png')]";
        break;
      default:
        decorators = "font-sans";
    }

    return cn(
      "min-h-screen text-white transition-all duration-700 bg-gradient-to-br", 
      style.colors,
      decorators
    );
  };

  // Mock data for charts
  const lineData = [
    { name: 'Admin', comp: 95, risk: 10 },
    { name: 'Device', comp: 80, risk: 30 },
    { name: 'Indication', comp: 90, risk: 15 },
    { name: 'Equivalence', comp: 60, risk: 50 },
    { name: 'Standards', comp: 85, risk: 20 },
    { name: 'V&V', comp: 40, risk: 70 },
  ];

  const radarData = [
    { subject: 'Biocompatibility', A: 120, B: 110, fullMark: 150 },
    { subject: 'Software', A: 98, B: 130, fullMark: 150 },
    { subject: 'Electrical', A: 86, B: 130, fullMark: 150 },
    { subject: 'Clinical', A: 99, B: 100, fullMark: 150 },
    { subject: 'Labeling', A: 85, B: 90, fullMark: 150 },
    { subject: 'Sterilization', A: 65, B: 85, fullMark: 150 },
  ];

  return (
    <div className={getStyleClasses()}>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="text-white" />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tighter">ORICKS v4.0</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
            { id: 'submission', icon: FileText, label: t.submission },
            { id: 'dataset', icon: Database, label: t.dataset },
            { id: 'results', icon: ClipboardCheck, label: t.results },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-6 h-6", activeTab === item.id ? "text-emerald-400" : "group-hover:text-emerald-400")} />
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Languages className="w-4 h-4 text-white/40" />
            <select 
              value={state.language}
              onChange={(e) => setState(prev => ({ ...prev, language: e.target.value as Language }))}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="zh" className="bg-slate-900">繁體中文</option>
              <option value="en" className="bg-slate-900">English</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-2">
            <Palette className="w-4 h-4 text-white/40" />
            <select 
              value={state.styleId}
              onChange={(e) => setState(prev => ({ ...prev, styleId: e.target.value }))}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              {PAINTER_STYLES.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 min-h-screen p-6 md:p-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{t.title}</h1>
            <p className="text-white/60">FDA 510(k) Regulatory Intelligence & Compliance Engine</p>
          </div>
          <div className="flex gap-3">
            {state.isProcessing && (
              <button 
                onClick={handleStopAgent}
                className="px-6 py-4 bg-rose-500 hover:bg-rose-400 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-rose-500/20 transition-all active:scale-95"
              >
                <div className="w-3 h-3 bg-white rounded-sm" />
                Stop
              </button>
            )}
            <button 
              onClick={handleStartAgent}
              disabled={state.isProcessing}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
              {state.isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {state.isProcessing ? t.processing : t.startAgent}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t.totalAgents} value="35" icon={Users} color="text-blue-400" />
                <StatCard title={t.reviewStatus} value="In Progress" icon={Loader2} color="text-amber-400" />
                <StatCard title={t.riskLevel} value="Moderate" icon={AlertTriangle} color="text-rose-400" />
                <StatCard title={t.compliance} value="78%" icon={CheckCircle2} color="text-emerald-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <h3 className="text-xl font-bold mb-6">Submission Completeness vs. Risk</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="comp" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} name="Completeness" />
                        <Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={3} dot={{ r: 6 }} name="Risk Level" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <h3 className="text-xl font-bold mb-6">Current vs. Predicate Metrics</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="rgba(255,255,255,0.2)" />
                        <Radar name="Subject Device" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                        <Radar name="Predicate Device" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <LiveLogs logs={logs} />
            </motion.div>
          )}

          {activeTab === 'submission' && (
            <motion.div 
              key="submission"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-60 uppercase tracking-widest">{t.summary}</label>
                  <textarea 
                    value={state.submissionSummary}
                    onChange={(e) => setState(prev => ({ ...prev, submissionSummary: e.target.value }))}
                    placeholder="Paste 510(k) submission summary here..."
                    className="w-full h-40 p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-60 uppercase tracking-widest">{t.notes}</label>
                  <textarea 
                    value={state.reviewNotes}
                    onChange={(e) => setState(prev => ({ ...prev, reviewNotes: e.target.value }))}
                    placeholder="Paste review notes here..."
                    className="w-full h-40 p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-60 uppercase tracking-widest">{t.guidance}</label>
                  <textarea 
                    value={state.reviewGuidance}
                    onChange={(e) => setState(prev => ({ ...prev, reviewGuidance: e.target.value }))}
                    placeholder="Paste 510(k) review guidance here..."
                    className="w-full h-40 p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-60 uppercase tracking-widest">{t.template}</label>
                  <textarea 
                    value={state.reportTemplate}
                    onChange={(e) => setState(prev => ({ ...prev, reportTemplate: e.target.value }))}
                    className="w-full h-[552px] p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dataset' && (
            <motion.div 
              key="dataset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t.dataset} (50 Entities)</h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => downloadFile(JSON.stringify(localEntities, null, 2), '510k_dataset.json', 'application/json')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadJson}
                  </button>
                  <button 
                    onClick={() => setState(prev => ({ ...prev, results: { ...prev.results, dataset: localEntities } }))}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {t.saveChanges}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {localEntities.length > 0 ? localEntities.map((entity, idx) => (
                  <div key={entity.id || idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Entity #{idx + 1}</span>
                      <button 
                        onClick={() => setLocalEntities(prev => prev.filter((_, i) => i !== idx))}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                    <input 
                      value={entity.key}
                      onChange={(e) => {
                        const next = [...localEntities];
                        next[idx].key = e.target.value;
                        setLocalEntities(next);
                      }}
                      className="w-full bg-transparent font-bold text-lg mb-2 focus:outline-none focus:text-emerald-400"
                    />
                    <input 
                      value={entity.value}
                      onChange={(e) => {
                        const next = [...localEntities];
                        next[idx].value = e.target.value;
                        setLocalEntities(next);
                      }}
                      className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                    <textarea 
                      value={entity.description}
                      onChange={(e) => {
                        const next = [...localEntities];
                        next[idx].description = e.target.value;
                        setLocalEntities(next);
                      }}
                      className="w-full bg-transparent text-xs opacity-60 h-16 resize-none focus:outline-none focus:opacity-100"
                    />
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center opacity-40 italic">
                    No dataset generated yet. Start the AI Agent to extract entities.
                  </div>
                )}
              </div>

              {state.results.followUpQuestions && (
                <div className="mt-12 p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Terminal className="text-emerald-400" />
                    {t.followUp}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.results.followUpQuestions.map((q, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm opacity-80 hover:opacity-100 transition-all">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Workflow Results</h2>
                {state.results.reviewReport && (
                  <button 
                    onClick={() => {
                      const allContent = `
# Web Search Summary
${state.results.webSearchSummary}

# Comprehensive 510(k) Summary
${state.results.comprehensiveSummary}

# Formal Review Report
${state.results.reviewReport}

# Skill Creator
${state.results.skillMd}
                      `;
                      downloadFile(allContent, 'oricks_full_report.md', 'text/markdown');
                    }}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download Full Package
                  </button>
                )}
              </div>

              {[
                { title: "Web Search Summary", content: state.results.webSearchSummary, filename: "web_search_summary.md" },
                { title: "Comprehensive 510(k) Summary", content: state.results.comprehensiveSummary, filename: "comprehensive_summary.md" },
                { title: "Formal Review Report", content: state.results.reviewReport, filename: "review_report.md" },
                { title: "Skill Creator (skill.md)", content: state.results.skillMd, filename: "skill.md" },
              ].map((res, i) => res.content && (
                <section key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">{res.title}</h2>
                    <button 
                      onClick={() => downloadFile(res.content!, res.filename, 'text/markdown')}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      {t.downloadMd}
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none prose-emerald prose-headings:font-bold prose-p:opacity-80 prose-li:opacity-80">
                    <Markdown>{res.content}</Markdown>
                  </div>
                </section>
              ))}

              {!state.results.reviewReport && (
                <div className="py-20 text-center opacity-40 italic">
                  No results generated yet. Start the AI Agent to begin the workflow.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Overlay */}
        {state.isProcessing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-slate-900 rounded-3xl p-10 border border-white/10 shadow-2xl space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Workflow in Progress</h3>
                <span className="text-emerald-400 font-mono">Step {state.agentStep}/5</span>
              </div>
              
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(state.agentStep / 5) * 100}%` }}
                />
              </div>

              <div className="space-y-4">
                {[
                  "Web Search Summary",
                  "Comprehensive Summary",
                  "Dataset Generation",
                  "Review Report",
                  "Skill Creator"
                ].map((step, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-4 transition-all duration-500",
                    state.agentStep > i + 1 ? "text-emerald-400" : state.agentStep === i + 1 ? "text-white" : "text-white/20"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      state.agentStep > i + 1 ? "border-emerald-400 bg-emerald-400/20" : state.agentStep === i + 1 ? "border-white animate-pulse" : "border-white/10"
                    )}>
                      {state.agentStep > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px]">{i + 1}</span>}
                    </div>
                    <span className="font-medium">{step}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-emerald-400/80">
                {logs[logs.length - 1]}
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={handleStopAgent}
                  className="px-8 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95"
                >
                  <div className="w-3 h-3 bg-rose-400 rounded-sm" />
                  Stop AI Workflow
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
