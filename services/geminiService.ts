
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile, DailyLog, HealthReport, MonthlyPlan, Medicine } from "../types";

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms + Math.random() * 1000));

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
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

const handleApiCall = async <T>(call: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await call();
  } catch (error: any) {
    let errorString = error?.message || "Unknown Error";
    console.error("Gemini API Error:", errorString);

    const isQuotaError = errorString.includes("429") || errorString.includes("quota") || errorString.includes("RESOURCE_EXHAUSTED");

    if (isQuotaError && retries > 0) {
      await sleep((4 - retries) * 6000);
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

const CLINICAL_SYSTEM_INSTRUCTION = "You are Dr. Rishu, a world-class Chief Medical Consultant at MediZen. You are authoritative, highly experienced, and professional. Your clinical reasoning follows the SOAP (Subjective, Objective, Assessment, Plan) methodology. For structured requests, adhere strictly to the provided JSON schema without preamble.";

const UNIX_SYSTEM_INSTRUCTION = "You are the MediZen Intelligence Assistant (MZ-1). Your primary directive is to provide technical and operational support for the MediZen application. \n\nRULES:\n1. Be extremely formal and professional in tone.\n2. Responses MUST be concise, strictly between 5 to 8 lines in length.\n3. ONLY answer questions related to MediZen, its features (Dashboard, Persona, Clinic, Pharmacy, Archive), and navigation.\n4. If asked about unrelated topics, politely state that you are only authorized to discuss MediZen operations.\n5. Do not provide medical advice; direct users to Dr. Rishu in the Clinic section.";

const DiagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A high-level professional summary of the patient's condition." },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific medical lifestyle changes." },
    medications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific drug molecules or products required." },
    specialty: { type: Type.STRING, description: "The medical department appropriate for this case." },
    fullSpeechText: { type: Type.STRING, description: "A detailed professional script for Dr. Rishu to explain the findings." }
  },
  required: ["summary", "recommendations", "medications", "specialty", "fullSpeechText"]
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
    doList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daily habits to maintain." },
    dontList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strictly prohibited activities or foods." },
    precautions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Red flag symptoms to watch out for." }
  },
  required: ["title", "dietStrategy", "phases", "doList", "dontList", "precautions"]
};

const WellnessAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Detailed clinical summary of neuro-wellness status." },
    category: { type: Type.STRING, enum: ["Normal", "Medium Risk", "Emergency"] },
    findings: {
      type: Type.OBJECT,
      properties: {
        depression: { type: Type.STRING, description: "Assessment of serotonin/depression markers." },
        anxiety: { type: Type.STRING, description: "Assessment of cortisol/anxiety markers." },
        ptsd: { type: Type.STRING, description: "Assessment of amygdala/PTSD markers." }
      },
      required: ["depression", "anxiety", "ptsd"]
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["summary", "category", "findings", "recommendations"]
};

export const generateMonthlyPlan = async (reports: HealthReport[], logs: DailyLog[], user: UserProfile): Promise<MonthlyPlan> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const prompt = `Dr. Rishu, synthesize a 30-day medical roadmap for: ${user.name}. Latest BP: ${user.bloodPressure}. Reports: ${JSON.stringify(reports)}. Output JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { 
        systemInstruction: "You are a clinical strategist. Ensure doList, dontList, and precautions have at least 5 entries each. Every field in the schema MUST be populated with high-quality data.",
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
    const prompt = `Dr. Rishu, analyze these mental health scores: ${JSON.stringify(scores)}. User Profile: ${JSON.stringify(user)}. Output clinical analysis in JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction: "You are a Chief Clinical Psychiatrist. Output strictly structured JSON for neuro-wellness analysis. Ensure 'findings' and 'summary' are detailed and never empty.",
        responseMimeType: "application/json",
        responseSchema: WellnessAnalysisSchema
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
        parts: [{ inlineData: { data: base64, mimeType } }, { text: "As Dr. Rishu, analyze this report. Output JSON." }]
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

export const unixChatbotResponse = async (message: string) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: { systemInstruction: UNIX_SYSTEM_INSTRUCTION }
    });
    return response.text;
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

export const getHealthForecast = async (logs: DailyLog[], user: UserProfile) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dr. Rishu, forecast trends: ${JSON.stringify({ logs, user })}`,
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateFormalDoctorReport = async (data: any, user: UserProfile) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a clinical report for: ${user.name}. Data: ${JSON.stringify(data)}. Use professional headers.`,
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION }
    });
    return response.text;
  });
};

export const getAdvancedDiagnosis = async (params: any) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          params.imageData ? { inlineData: { data: params.imageData, mimeType: params.mimeType } } : null,
          { text: `Diagnose patient ${params.user.name}. Symptoms: ${params.symptoms}. Output JSON.` }
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

export const findNearbyClinics = async (specialty: string, lat?: number, lng?: number) => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find ${specialty} clinics.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined } }
      },
    });
    return {
      text: response.text,
      locations: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.maps?.title || 'Clinic',
        uri: chunk.maps?.uri
      })) || []
    };
  });
};

export const extractMetricsFromReport = async (condition: string): Promise<Partial<UserProfile>> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract biomarkers: ${condition}`,
      config: { 
        systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const identifyMedicine = async (name: string): Promise<Partial<Medicine>> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify pharmacology for: "${name}". Output JSON.`,
      config: { 
        systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const suggestMedicines = async (query: string): Promise<Medicine[]> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest medicines for: "${query}". Output JSON array.`,
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const results = JSON.parse(response.text || '[]');
    return results.map((m: any) => ({ ...m, id: 'med_' + Math.random().toString(36).substr(2, 9), price: m.price || 299 }));
  });
};

export const analyzeMedicineImage = async (base64: string, mimeType: string): Promise<Medicine> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Identify medicine. Output JSON." }] },
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || '{}');
    return { ...data, id: 'med_' + Date.now(), price: data.price || 199 };
  });
};

export const extractMedicinesFromReport = async (base64: string, mimeType: string): Promise<Medicine[]> => {
  return handleApiCall(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Extract medicines from report. Output JSON array." }] },
      config: { systemInstruction: CLINICAL_SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const results = JSON.parse(response.text || '[]');
    return results.map((m: any) => ({ ...m, id: 'med_' + Math.random().toString(36).substr(2, 9), price: m.price || 399 }));
  });
};
