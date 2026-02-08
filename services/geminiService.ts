
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile, DailyLog, HealthReport, MonthlyPlan, Medicine } from "../types";

// Safety polyfill for browser environments lacking Node.js process globals


const sleep = (ms: number) => new Promise(res => setTimeout(res, ms + Math.random() * 1000));

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY");
    throw new Error("API_KEY_MISSING");
  }

  return new GoogleGenAI({ apiKey });
};

export const cleanReportText = (text: string) => {
  return text
    .replace(/\*\*/g, '')
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .trim();
};

export const downloadAsFile = (filename: string, text: string) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const handleApiCall = async <T>(call: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await call();
  } catch (error: any) {
    let errorString = error?.message || "Unknown Error";
    console.error("Gemini API Error:", errorString);

    const isQuotaError = errorString.includes("429") || errorString.includes("quota") || errorString.includes("RESOURCE_EXHAUSTED");
    const isAuthError = errorString.includes("API_KEY_MISSING") || errorString.includes("403") || errorString.includes("key not valid");

    if (isAuthError) throw new Error("AUTHENTICATION_FAILED");
    if (isQuotaError && retries > 0) {
      await sleep(3000);
      return handleApiCall(call, retries - 1);
    }
    if (isQuotaError) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
};

let currentAudioSource: AudioBufferSourceNode | null = null;
let currentAudioContext: AudioContext | null = null;

export const stopAllAudio = () => {
  if (currentAudioSource) { try { currentAudioSource.stop(); } catch (e) {} currentAudioSource = null; }
  if (currentAudioContext) { try { currentAudioContext.close(); } catch (e) {} currentAudioContext = null; }
};

const CLINICAL_SYSTEM_INSTRUCTION = "You are Dr. Rishu, a world-class Chief Medical Consultant at MediZen. You are authoritative, highly experienced, and professional. Your clinical reasoning follows the SOAP methodology. For structured requests, adhere strictly to the JSON schema provided.";

const DiagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Professional summary of the condition." },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    medications: { type: Type.ARRAY, items: { type: Type.STRING } },
    specialty: { type: Type.STRING },
    fullSpeechText: { type: Type.STRING }
  },
  required: ["summary", "recommendations", "medications", "specialty", "fullSpeechText"]
};

const WellnessSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    category: { type: Type.STRING, enum: ["Normal", "Medium Risk", "Emergency"] },
    findings: {
      type: Type.OBJECT,
      properties: {
        depression: { type: Type.STRING },
        anxiety: { type: Type.STRING },
        ptsd: { type: Type.STRING }
      },
      required: ["depression", "anxiety", "ptsd"]
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["summary", "category", "findings", "recommendations"]
};

const MonthlyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    dietStrategy: { type: Type.STRING },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          days: { type: Type.STRING },
          focus: { type: Type.STRING },
          activities: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["phase", "days", "focus", "activities"]
      }
    },
    doList: { type: Type.ARRAY, items: { type: Type.STRING } },
    dontList: { type: Type.ARRAY, items: { type: Type.STRING } },
    precautions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "dietStrategy", "phases", "doList", "dontList", "precautions"]
};

// Fix: Add schemas for Medicine objects to ensure structured identification and extraction
const MedicineSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    type: { type: Type.STRING },
    uses: { type: Type.ARRAY, items: { type: Type.STRING } },
    dosage: { type: Type.STRING },
    price: { type: Type.NUMBER },
    description: { type: Type.STRING }
  },
  required: ["name", "type", "uses", "dosage", "price", "description"]
};

const MedicineListSchema = {
  type: Type.ARRAY,
  items: MedicineSchema
};

export const extractMetricsFromReport = async (text: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract health metrics: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bloodPressure: { type: Type.STRING },
            bloodSugar: { type: Type.NUMBER },
            stressLevel: { type: Type.NUMBER },
            hemoglobin: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateFormalDoctorReport = async (analysis: any, user: UserProfile) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate clinical report for ${user.name}. Data: ${JSON.stringify(analysis)}`,
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  });
};

export const getAdvancedDiagnosis = async (params: any) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          params.imageData ? { inlineData: { data: params.imageData, mimeType: params.mimeType } } : null,
          { text: `Diagnose patient ${params.user.name}. Symptoms: ${params.symptoms}. Mode: ${params.mode}.` }
        ].filter(Boolean) as any
      },
      config: { 
        systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json",
        responseSchema: DiagnosisSchema
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeHealthReport = async (base64: string, mimeType: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { data: base64, mimeType } }, { text: "Analyze this medical document. Output JSON." }]
      },
      config: { 
        systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json",
        responseSchema: DiagnosisSchema
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateVoiceResponse = async (text: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 500) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const playAudio = async (base64Data: string) => {
  if (!base64Data) return;
  stopAllAudio();
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  currentAudioContext = ctx;
  const binaryString = atob(base64Data);
  const data = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) data[i] = binaryString.charCodeAt(i);
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  currentAudioSource = source;
};

export const unixChatbotResponse = async (message: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: { systemInstruction: "You are MZ-1, technical support for MediZen." }
    });
    return response.text;
  });
};

export const chatWithConsultant = async (history: any[], message: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION }
    });
    return response.text;
  });
};

export const generateMonthlyPlan = async (reports: HealthReport[], logs: DailyLog[], user: UserProfile): Promise<MonthlyPlan> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const historyContext = {
      userMetrics: { age: user.age, bp: user.bloodPressure, sugar: user.bloodSugar, stress: user.stressLevel },
      recentReports: reports.slice(0, 3).map(r => ({ specialty: r.specialty, summary: r.analysis.summary })),
      recentLogs: logs.slice(0, 5)
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Generate a comprehensive 30-day health protocol based on this clinical history: ${JSON.stringify(historyContext)}. Ensure all fields in the schema are populated with actionable medical-grade advice. Do not return empty lists for doList or dontList.`,
      config: { 
        systemInstruction: "You are a Chief Clinical Strategist. Create a detailed 30-day medical roadmap.",
        responseMimeType: "application/json",
        responseSchema: MonthlyPlanSchema
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeWellnessScores = async (scores: any, user: UserProfile) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze neuro-wellness data for ${user.name}: ${JSON.stringify(scores)}. Follow the provided schema strictly.`,
      config: { 
        systemInstruction: "You are a world-class psychiatrist. Analyze psychological indices (PHQ9, GAD7, PTSD) and provide clinical findings.",
        responseMimeType: "application/json",
        responseSchema: WellnessSchema
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const getHealthForecast = async (logs: DailyLog[], user: UserProfile) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Forecast: ${JSON.stringify({ logs, user })}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High"] }
          },
          required: ["prediction", "actions", "riskLevel"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// Fix: Add missing findNearbyClinics for DocMate using Gemini 2.5 series with googleMaps tool
export const findNearbyClinics = async (specialty: string, latitude?: number, longitude?: number) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const contents = `Find top rated ${specialty} clinics or doctors nearby. Provide current and accurate information.`;
    const config: any = {
      tools: [{ googleMaps: {} }],
    };
    
    if (latitude !== undefined && longitude !== undefined) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude, longitude }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config,
    });

    const locations = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .filter((chunk: any) => chunk.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title,
        uri: chunk.maps.uri
      }));

    return {
      locations,
      text: response.text || "No additional clinical routing details provided."
    };
  });
};

// Fix: Add missing identifyMedicine for Medico to resolve molecule identification queries
export const identifyMedicine = async (name: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify this medicine and provide its clinical profile: ${name}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: MedicineSchema
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// Fix: Add missing suggestMedicines for Medico to provide pharmaceutical suggestions based on symptoms
export const suggestMedicines = async (query: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest appropriate over-the-counter or common medicines for: ${query}. Return a list of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: MedicineListSchema
      }
    });
    return JSON.parse(response.text || '[]');
  });
};

// Fix: Add missing analyzeMedicineImage for Medico multimodal visual identification
export const analyzeMedicineImage = async (base64: string, mimeType: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Identify the pharmaceutical product in this image and provide clinical data including uses and dosage." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MedicineSchema
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

// Fix: Add missing extractMedicinesFromReport for Medico script scanning feature
export const extractMedicinesFromReport = async (base64: string, mimeType: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Identify all medications mentioned in this clinical report. For each, extract its name, class (type), uses, recommended dosage, and a brief description. Assign a representative market price in INR." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MedicineListSchema
      }
    });
    return JSON.parse(response.text || '[]');
  });
};

export const encodePCM = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const decodePCM = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
