import { GoogleGenAI } from "@google/genai";
import { CreditCard } from "../types";

const ai = new GoogleGenAI({
  apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.API_KEY || ""
});

const getSystemPrompt = (cards: CreditCard[]) => {
  const cardSummary = cards.map(c =>
    `- ${c.bankName} (${c.cardName}): Limit: ₺${c.limit.toLocaleString('tr-TR')}, Borç: ₺${c.balance.toLocaleString('tr-TR')}, Kesim Günü: ${c.statementDay}, Son Ödeme Günü: ${c.dueDay}`
  ).join('\n');

  return `Sen "Card Master" uygulamasının akıllı finansal asistanısın. Görevin, kullanıcının kredi kartı verilerine dayanarak onlara tavsiyeler vermek, sorularını yanıtlamak ve finansal stratejiler geliştirmektir.

Kullanıcının Mevcut Kartları:
${cardSummary}

Kurallar:
1. Yanıtların her zaman profesyonel, yapıcı ve kısa olsun.
2. Harcama ve borç dengesine odaklan.
3. Eğer kullanıcı spesifik bir kart hakkında soru sorarsa, yukarıdaki verileri kullan.
4. Yatırım tavsiyesi vermediğini, sadece mevcut veriler üzerinden asistanlık yaptığını hatırla.
5. Her zaman Türkçe yanıt ver.
6. Yanıtlarında markdown kullanabilirsin.`;
};

export const getFinancialAdvice = async (cards: CreditCard[]) => {
  if (cards.length === 0) return [];

  const prompt = `Kullanıcının kart verilerine bakarak 3 tane acil ve stratejik finansal tavsiye ver. 
  Lütfen her tavsiyeyi message ve type ("tip", "warning", "strategy") alanlarını içeren bir JSON objesi olarak döndür.
  Sadece JSON döndür.
  
  Örnek:
  [
    {"type": "warning", "message": "..."},
    ...
  ]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        { role: "user", parts: [{ text: getSystemPrompt(cards) }] },
        { role: "model", parts: [{ text: "Anladım. Kullanıcının finansal verilerine hakimim ve tavsiyelerimi buna göre vereceğim." }] },
        { role: "user", parts: [{ text: prompt }] }
      ]
    });

    const responseText = response.text || "";
    const jsonMatch = responseText.match(/\[.*\]/s);
    const insights = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    return insights;
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return [{ type: 'warning', message: 'Şu an tavsiye üretilemiyor. Lütfen API anahtarınızı kontrol edin.' }];
  }
};

export const getChatResponse = async (cards: CreditCard[], userMessage: string, chatHistory: { role: string, content: string }[]) => {
  try {
    const contents = [
      { role: "user", parts: [{ text: getSystemPrompt(cards) }] },
      { role: "model", parts: [{ text: "Anladım. Card Master asistanı olarak hazırım. Sorularınızı yanıtlayabilirim." }] },
      ...chatHistory.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
      { role: "user", parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents as any
    });

    return response.text || "Üzgünüm, bir hata oluştu.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Üzgünüm, şu an yanıt veremiyorum. Lütfen internet bağlantınızı veya API anahtarınızı kontrol edin.";
  }
};
