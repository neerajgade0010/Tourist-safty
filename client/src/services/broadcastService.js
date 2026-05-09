import api from "./api.js";

export const getActiveBroadcasts = () =>
  api.get("/broadcasts/active").then((res) => res.data);

export const getAllBroadcasts = () =>
  api.get("/broadcasts").then((res) => res.data);

export const createBroadcast = (data) =>
  api.post("/broadcasts", data).then((res) => res.data);

export const updateBroadcast = (id, data) =>
  api.patch(`/broadcasts/${id}`, data).then((res) => res.data);

export const deleteBroadcast = (id) =>
  api.delete(`/broadcasts/${id}`).then((res) => res.data);
