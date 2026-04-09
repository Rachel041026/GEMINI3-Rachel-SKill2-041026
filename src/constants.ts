export const DEFAULT_TEMPLATE = `510(k) 審查報告：[裝置名稱] ([510(k) 編號])
1. 執行摘要 (Executive Summary)
2. 行政與分類資訊 (Administrative and Classification Information)
3. 裝置描述 (Device Description)
4. 適應症 (Indications for Use)
5. 實質等效性比較 (Substantial Equivalence Discussion)
6. 符合之共識標準 (Consensus Standards)
7. 性能數據：軟體驗證與確認 (V&V)
8. 詳細審查清單 (Detailed Review Checklist)
9. 數據集中提取的 20 個關鍵實體 (Extracted Entities)
10. 結論 (Conclusion)
11. 後續審查追蹤問題 (20 Follow-up Questions)`;

export const PAINTER_STYLES = [
  { id: 'modern', name: 'Modern (Default)', colors: 'from-slate-900 to-slate-800' },
  { id: 'van-gogh', name: 'Van Gogh', colors: 'from-blue-700 via-yellow-500 to-blue-900' },
  { id: 'picasso', name: 'Picasso', colors: 'from-gray-300 via-orange-200 to-blue-400' },
  { id: 'monet', name: 'Monet', colors: 'from-pink-100 via-blue-100 to-green-100' },
  { id: 'banksy', name: 'Banksy', colors: 'from-gray-900 via-gray-700 to-gray-800' },
  { id: 'warhol', name: 'Warhol', colors: 'from-cyan-400 via-magenta-500 to-yellow-400' },
  { id: 'klimt', name: 'Klimt', colors: 'from-yellow-600 via-yellow-400 to-yellow-700' },
];

export const DICT = {
  zh: {
    title: "ORICKS v4.0 — FDA 510(k) AI 審查系統",
    dashboard: "儀表板",
    submission: "提交模組",
    dataset: "數據集編輯",
    results: "審查結果",
    startAgent: "啟動 AI 代理",
    processing: "AI 正在處理中...",
    language: "輸出語言",
    style: "介面風格",
    summary: "提交摘要",
    notes: "審查筆記",
    guidance: "審查指引",
    template: "報告模板",
    downloadJson: "下載 JSON",
    downloadMd: "下載 Markdown",
    saveChanges: "儲存變更",
    totalAgents: "總代理數",
    reviewStatus: "審查狀態",
    riskLevel: "風險等級",
    compliance: "合規百分比",
    liveLogs: "即時代理日誌",
    followUp: "後續審查追蹤問題",
  },
  en: {
    title: "ORICKS v4.0 — FDA 510(k) AI Review System",
    dashboard: "Dashboard",
    submission: "Submission Module",
    dataset: "Dataset Editor",
    results: "Review Results",
    startAgent: "Start AI Agent",
    processing: "AI Processing...",
    language: "Output Language",
    style: "UI Style",
    summary: "Submission Summary",
    notes: "Review Notes",
    guidance: "Review Guidance",
    template: "Report Template",
    downloadJson: "Download JSON",
    downloadMd: "Download Markdown",
    saveChanges: "Save Changes",
    totalAgents: "Total Agents",
    reviewStatus: "Review Status",
    riskLevel: "Risk Level",
    compliance: "Compliance %",
    liveLogs: "Live Agent Logs",
    followUp: "Follow-up Questions",
  }
};
