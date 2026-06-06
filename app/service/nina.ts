import { GoogleGenAI, Type } from "@google/genai";
import { GetTaskCounter } from "./taskCounter";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Props {
  sender: string;
  message: string;
  finally(): void;
}

export interface NinaAction {
  endpoint: string;
  param1: string;
  param2: string;
  param3: string;
}

export interface NinaAgentResponse {
  message_response: string;
  action: NinaAction[];
}

export default async function Nina(
  props: Props,
): Promise<NinaAgentResponse | null> {
  const todayDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  try {
    const systemInstruction = `Anda adalah Nina (Network Intelligence & Notification Assistant), 
sistem AI expert penanganan masalah jaringan dan infrastruktur data center untuk tim NOC.

Note Penting:
1. Jika ada yang bertanya, jangan pernah bilang kau adalah Gemini. Cukup bilang kau adalah Nina, AI Assistant yang dibuat oleh Bima. Tapi jika tidak ditanya, tidak perlu disebutkan.
2. Tidak harus selalu menyebutkan nama pengirim setiap membalas prompt.

Tugas Anda:
1. Berikan jawaban/analisis teks yang ramah, taktis, dan ringkas pada properti 'message_response'.
2. Jika pesan tim NOC memerlukan tindakan sistem (seperti cek ping, restart port, cek sensor suhu, atau eskalasi tiket), buat daftar instruksinya di dalam array 'action'. 
3. Jika pesan pengguna hanyalah obrolan biasa atau tidak memerlukan eksekusi teknis sistem, biarkan array 'action' kosong [].

Aturan Penting Variabel Action:
- Properti 'endpoint', 'param1', 'param2', dan 'param3' semuanya WAJIB diisi di setiap objek di dalam array.
- Jika sebuah parameter TIDAK dibutuhkan oleh endpoint tersebut, Anda WAJIB mengisinya dengan string kosong murni "" (tanpa spasi). Jangan pernah mengirimkan nilai null, undefined, atau mengabaikan properti tersebut.

Panduan Mengisi Array 'action' (Gunakan endpoint yang relevan):
1. Task Counter
- Update -> endpoint: "task-counter", param1: "[inisial]", param2: "[nama]", param3: "[jumlah]".

Data Terbaru di Database:
1. Task Counter
${await GetTaskCounter()}

Waktu analisis saat ini (Hari ini): ${todayDate}.
Personel NOC yang sedang berbicara dengan Anda saat ini (Sender): ${props.sender}.`;

    const finalPrompt = `${systemInstruction}\n\nInput Tim NOC: "${props.message}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: finalPrompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 2500,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message_response: {
              type: Type.STRING,
              description: "Jawaban teks untuk dibaca oleh tim NOC.",
            },
            action: {
              type: Type.ARRAY,
              description:
                "Daftar fungsi sistem yang harus dieksekusi oleh backend.",
              items: {
                type: Type.OBJECT,
                properties: {
                  endpoint: {
                    type: Type.STRING,
                    description: "Nama rute API internal backend.",
                  },
                  param1: {
                    type: Type.STRING,
                    description:
                      "Parameter pertama. Jika tidak dipakai, isi dengan string kosong.",
                  },
                  param2: {
                    type: Type.STRING,
                    description:
                      "Parameter kedua. Jika tidak dipakai, isi dengan string kosong.",
                  },
                  param3: {
                    type: Type.STRING,
                    description:
                      "Parameter ketiga. Jika tidak dipakai, isi dengan string kosong.",
                  },
                },
                required: ["endpoint", "param1", "param2", "param3"],
              },
            },
          },
          required: ["message_response", "action"],
        },
      },
    });

    const aiRawText = response.text;
    if (!aiRawText) throw new Error("Tidak ada respon");

    return JSON.parse(aiRawText.trim()) as NinaAgentResponse;
  } catch (err: any) {
    console.error("Error pada Fungsi Nina Service:", err);
    return null;
  } finally {
    props.finally();
  }
}
