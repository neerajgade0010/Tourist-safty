import fetch from "node-fetch";

// Ordered list of free models to try — if one fails/rate-limits, the next is tried
const FREE_MODELS = [
  "openrouter/auto",                                    // Auto-picks best available model
  "deepseek/deepseek-v4-flash:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

const callOpenRouter = async (apiKey, prompt, model) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:5173",
      "X-Title": "Tourist Safety Assistant",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return { status: response.status, data };
};

export const chatWithAI = async (req, res) => {
  try {
    const { message, location } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ reply: "AI not configured. Please add OPENROUTER_API_KEY to server/.env" });
    }

    const prompt = `You are an expert tourist safety assistant for travelers in India, especially Himachal Pradesh (Shimla, Manali, Dharamshala, Kasol, Spiti, etc.).

User's current location: ${location || "not specified"}
User's question: ${message}

Instructions:
- Give a direct, helpful, and informative answer to the question.
- If asked about tourist spots, list the top 5 famous places with brief descriptions.
- If asked about food, recommend local dishes and popular restaurants/dhabas.
- If asked about hotels, suggest types of accommodation and tips for booking.
- If asked about safety, give specific practical advice.
- If asked about weather, give seasonal travel tips.
- If asked about transport, explain available options (bus, taxi, train).
- Always be friendly, concise (3-5 sentences or a short list), and specific to India/Himachal if relevant.
- Use emojis to make the response more engaging.
- Do NOT redirect to other tools — give the actual information directly.`;

    // Try each model in order until one succeeds
    let lastError = null;
    for (const model of FREE_MODELS) {
      try {
        const { status, data } = await callOpenRouter(apiKey, prompt, model);

        // OpenRouter wraps errors in the body even on HTTP 200
        const errorCode = data?.error?.code;
        const errorMsg = data?.error?.message || "";
        const isRateLimit = status === 429 || errorCode === 429 ||
          errorMsg.toLowerCase().includes("rate") ||
          errorMsg.toLowerCase().includes("provider returned error") ||
          errorMsg.toLowerCase().includes("temporarily");

        if (isRateLimit) {
          console.warn(`Model ${model} rate-limited, trying next...`);
          lastError = errorMsg || "Rate limited";
          continue;
        }

        if (status !== 200 || errorCode) {
          console.warn(`Model ${model} error (${status}): ${errorMsg}`);
          lastError = errorMsg || `Model ${model} unavailable`;
          continue;
        }

        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
          console.warn(`Model ${model} returned empty reply`);
          lastError = "Empty response";
          continue;
        }

        console.log(`✅ AI responded via model: ${model}`);
        return res.json({ reply });

      } catch (modelErr) {
        console.warn(`Model ${model} threw error:`, modelErr.message);
        lastError = modelErr.message;
        continue;
      }
    }

    // All models failed
    console.error("All AI models failed. Last error:", lastError);
    return res.status(503).json({
      reply: "⚠️ The AI service is currently busy due to high traffic. Please wait a few seconds and try again.",
    });

  } catch (error) {
    console.error("AI ERROR:", error.message);
    res.status(500).json({
      reply: "⚠️ Could not reach the AI service. Please check your internet connection and try again.",
    });
  }
};
