import api from "./api.js";

export const updateLocation = (userId, lat, lng) =>
  api.post("/location/update", { userId, lat, lng });

export const getAllLocations = () =>
  api.get("/location/all");

export const getUserLocation = (userId) =>
  api.get(`/location/${userId}`);

export const stopSharing = (userId) =>
  api.post("/location/stop", { userId });
