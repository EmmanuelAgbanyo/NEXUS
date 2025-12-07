
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const suggestCOACode = async (accountName: string, existingAccounts: {code: string, name: string}[]) => {
  if (!ai) {
    console.warn("Gemini API Key not found");
    return { suggestedCode: '00000', accountType: 'Expense', reasoning: 'AI not configured' };
  }

  const model = "gemini-2.5-flash";
  const prompt = `
    You are an expert accounting system assistant.
    I need to add a new account named "${accountName}" to the Chart of Accounts.
    
    Here is a sample of existing accounts to understand the structure:
    ${JSON.stringify(existingAccounts.slice(0, 15))}
    
    Determine the best Account Type (Asset, Liability, Equity, Revenue, Expense) and a unique 5-digit Code based on standard accounting practices (e.g., Assets 1xxxx, Liabilities 2xxxx, Equity 3xxxx, Revenue 4xxxx, Expenses 5xxxx/6xxxx).
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCode: { type: Type.STRING },
            accountType: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return null;
  }
};

export const analyzePolicyImpact = async (policyChangeDescription: string) => {
    if (!ai) return "AI unavailable";
    
    const model = "gemini-2.5-flash";
    const prompt = `
      Analyze the impact of the following accounting policy change on an ERP system: "${policyChangeDescription}".
      Briefly list 3 potential risks or considerations in bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (e) {
        return "Could not analyze policy impact.";
    }
};

export const suggestJournalLines = async (description: string, coaSample: any[]) => {
    if (!ai) return null;
    
    const model = "gemini-2.5-flash";
    const prompt = `
        You are an intelligent ERP assistant.
        Analyze this accounting transaction description: "${description}".
        
        Based on the provided Chart of Accounts, suggest the Debit and Credit lines.
        If an amount is mentioned in the text, use it. If multiple amounts are clear, split them. 
        If no amount is clear, use 0.
        
        Available Accounts:
        ${JSON.stringify(coaSample)}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lines: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    accountCode: { type: Type.STRING },
                                    debit: { type: Type.NUMBER },
                                    credit: { type: Type.NUMBER },
                                    reasoning: { type: Type.STRING }
                                }
                            }
                        },
                        summary: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Gemini Journal Suggestion Error:", e);
        return null;
    }
};

export const explainJournalTransaction = async (entryData: any) => {
    if (!ai) return "AI unavailable";

    const model = "gemini-2.5-flash";
    const prompt = `
        Act as a senior financial auditor.
        Analyze the following journal entry and provide a concise "Audit Insight".
        Explain the financial impact (e.g., "Increases expenses, reduces cash flow") and flag any unusual characteristics if present.
        Keep it under 50 words.

        Entry Data:
        ${JSON.stringify(entryData)}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (e) {
        return "Could not generate audit insight.";
    }
};

export const suggestRolePermissions = async (roleName: string, description: string, availableModules: string[], permissionTypes: string[]) => {
    if (!ai) return null;

    const model = "gemini-2.5-flash";
    const prompt = `
        You are an ERP security expert.
        I have a role named "${roleName}" with description: "${description}".

        Available Modules: ${JSON.stringify(availableModules)}
        Available Permissions: ${JSON.stringify(permissionTypes)}

        Suggest the appropriate permissions for this role to follow the Principle of Least Privilege.
        Return a JSON object where keys are Module Names and values are arrays of permission strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        permissions: {
                            type: Type.OBJECT,
                            description: "Map of module names to permission arrays",
                            nullable: true
                        },
                        reasoning: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Gemini Role Suggestion Error:", e);
        return null;
    }
};

export const generateCOAFromDocument = async (base64Data: string, mimeType: string) => {
    if (!ai) return null;

    const model = "gemini-2.5-flash";
    const prompt = `
        You are an expert accounting system setup agent.
        I have uploaded a financial document (Balance Sheet, Income Statement, or Invoice).
        
        Analyze this document and extract a list of potential General Ledger Accounts that should be in the Chart of Accounts.
        For each identified account:
        1. Assign a standard 5-digit Code (Asset:1xxxx, Liab:2xxxx, Equity:3xxxx, Rev:4xxxx, Exp:5xxxx).
        2. Determine the Account Type.
        3. Provide a brief reasoning for the extraction.
        
        Return a JSON list of unique accounts found.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        extractedAccounts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    suggestedCode: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    reasoning: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Gemini Document Analysis Error:", e);
        return null;
    }
};

export const getChatResponse = async (userQuery: string) => {
    if (!ai) return "I'm offline right now. Please check your API key.";

    const model = "gemini-2.5-flash";
    const prompt = `
        You are "Nexus AI", a friendly and professional support assistant for the Nexus Quantum Ledger ERP system.
        
        System Context:
        - Nexus is a multi-tenant cloud ERP.
        - Modules: Journal Entries, General Ledger, AP, AR, Payroll, System Config.
        - Features: AI Auto-coding, Multi-currency, Role-based access.
        
        User Query: "${userQuery}"
        
        Provide a helpful, concise response. If the query is about specific accounting tasks (e.g., "How to reverse a journal"), explain the steps in the UI.
        If you don't know, suggest contacting human support.
        Keep response under 3 sentences unless detailed steps are needed.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (e) {
        return "I'm having trouble connecting to the knowledge base.";
    }
};

export const connectLiveSession = async (callbacks: any) => {
    if (!ai) throw new Error("AI not initialized. Please check API Key.");
    
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: {
                parts: [{ text: "You are Nexus Voice, a polite and efficient ERP assistant. Answer accounting questions briefly." }]
            }
        },
        callbacks
    });
};
