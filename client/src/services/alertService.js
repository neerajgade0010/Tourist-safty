import api from "./api.js";

export const createAlert = (userId, lat, lng) =>
  api.post("/alert/create", { userId, lat, lng });

export const getAlerts = () =>
  api.get("/alert/all");
