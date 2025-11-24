import { GoogleGenAI, Type } from "@google/genai";
import { PatrolStatus, AIAnalysisResult } from '../types';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY || '';

// Initialize the client only if key exists to avoid immediate crash, though key is required.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper function to compress image
const compressImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if width exceeds maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Convert to JPEG with 0.7 quality to reduce size significantly
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = (error) => reject(error);
  });
};

export const analyzePatrolImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  if (!ai) {
    throw new Error("API Key Gemini tidak ditemukan.");
  }

  try {
    // Compress the image before sending to avoid payload size limits/XHR errors
    const compressedImage = await compressImage(base64Image);
    
    // Remove data URL prefix (now strictly jpeg due to compression)
    const base64Data = compressedImage.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          {
            text: "Analisis gambar ini untuk laporan patroli keamanan. Apakah ruangan aman? Apa saja yang terlihat?"
          }
        ]
      },
      config: {
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              enum: [PatrolStatus.SECURE, PatrolStatus.ATTENTION, PatrolStatus.DANGER],
              description: "Status keamanan berdasarkan visual gambar."
            },
            summary: {
              type: Type.STRING,
              description: "Ringkasan singkat kondisi ruangan (maks 2 kalimat)."
            },
            itemsDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar objek relevan yang terdeteksi (misal: kursi, meja, pemadam api, sampah)."
            }
          },
          required: ["status", "summary", "itemsDetected"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Tidak ada respon dari AI.");
    }

    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing image:", error);
    // Fallback if AI fails, allows the app to continue functioning manually
    return {
      status: PatrolStatus.ATTENTION,
      summary: "Gagal menganalisis gambar (Error koneksi/API). Harap periksa manual.",
      itemsDetected: []
    };
  }
};