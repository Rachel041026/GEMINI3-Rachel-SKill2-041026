import { GoogleGenAI, Type } from "@google/genai";
import { Entity, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WorkflowInputs {
  summary: string;
  notes: string;
  guidance: string;
  template: string;
  language: Language;
}

export async function runWorkflow(
  inputs: WorkflowInputs,
  onProgress: (step: number, log: string) => void
) {
  const { summary, notes, guidance, template, language } = inputs;
  const langSuffix = language === 'zh' ? 'Please respond in Traditional Chinese.' : 'Please respond in English.';

  // Step 1: Web Search Summary
  onProgress(1, "Agent #1: Searching web for FDA guidance and predicate device history...");
  const step1Response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Search for FDA guidance, relevant predicate device history, and consensus standards (e.g., ISO 10993, IEC 60601) related to this device: ${summary}. 
    Create a comprehensive summary in markdown of 2000-3000 words. ${langSuffix}`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  const webSearchSummary = step1Response.text || "";

  // Step 2: Comprehensive 510(k) Summary
  onProgress(2, "Agent #2: Synthesizing internal data and web search results...");
  const step2Response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the user provided submission summary: "${summary}", review notes: "${notes}", and guidance: "${guidance}", along with the following web research: "${webSearchSummary}", 
    create a comprehensive 510(k) summary in markdown of 3000-4000 words. Include detailed device description, indications for use, substantial equivalence discussion, and performance data overview. ${langSuffix}`,
  });
  const comprehensiveSummary = step2Response.text || "";

  // Step 3: Dataset Generation
  onProgress(3, "Agent #3: Extracting structured dataset (50 entities)...");
  const step3Response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract exactly 50 distinct entities from the following 510(k) summary: "${comprehensiveSummary}". 
    Each entity should have an id, key (e.g., "Sterilization Method"), value (e.g., "Ethylene Oxide"), and description. ${langSuffix}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                key: { type: Type.STRING },
                value: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["id", "key", "value", "description"],
            },
          },
        },
        required: ["entities"],
      },
    },
  });
  
  let dataset: Entity[] = [];
  try {
    const parsed = JSON.parse(step3Response.text || "{}");
    dataset = parsed.entities || [];
  } catch (e) {
    console.error("Failed to parse dataset JSON", e);
  }

  // Step 4: Review Report
  onProgress(4, "Agent #4: Generating formal 510(k) review report...");
  const step4Response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Using the dataset: ${JSON.stringify(dataset)}, the web research: "${webSearchSummary}", and the comprehensive summary: "${comprehensiveSummary}", 
    generate a formal 510(k) review report based on this template: "${template}". 
    The report must be 3000-4000 words in markdown. 
    Requirements: 
    1. Include 5 detailed tables.
    2. Include 20 specific entities from the dataset.
    3. Include a comprehensive review checklist.
    4. End with 20 comprehensive follow-up questions.
    ${langSuffix}`,
  });
  const reviewReport = step4Response.text || "";

  // Extract follow-up questions from the report (simple heuristic)
  const followUpQuestions = reviewReport.split(/20 Follow-up Questions|後續審查追蹤問題/i)[1]?.split('\n').filter(l => l.match(/^\d+\./)).map(l => l.trim()) || [];

  // Step 5: Skill Creator
  onProgress(5, "Agent #5: Creating persistent skill.md for future reviews...");
  const step5Response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a "skill.md" file that encapsulates the logic for creating comprehensive review reports of similar devices based on the previous results. 
    Include 3 "WOW" AI features: 
    1. Adversarial Red Team Simulation (identifying hidden gaps).
    2. Future-Proof Analysis (predicting future regulatory shifts).
    3. Comparison Ghosting (deep-dive into predicate device weaknesses).
    ${langSuffix}`,
  });
  const skillMd = step5Response.text || "";

  onProgress(0, "Workflow complete.");

  return {
    webSearchSummary,
    comprehensiveSummary,
    dataset,
    reviewReport,
    skillMd,
    followUpQuestions: followUpQuestions.slice(0, 20),
  };
}
