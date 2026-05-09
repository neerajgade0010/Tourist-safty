import api from "./api.js";

export const chatWithAI = (message, location) =>
  api.post("/ai/chat", { message, location });
