import axios from "axios";

export const chatWithAI = async (req, res) => {
  try {
    const { message, location } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const prompt = `
You are a smart tourist safety assistant.

User location: ${location || "unknown"}
User question: ${message}

Give short helpful answers. Focus on safety.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      response.data.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message);

    res.status(500).json({
      reply: "AI error",
      error: error.message
    });
  }
};