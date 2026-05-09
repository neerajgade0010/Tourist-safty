import api from "./api";

export const createIncident = (data) => api.post("/incidents", data).then((r) => r.data);

export const getIncidents = (bbox) =>
  api.get("/incidents", { params: bbox }).then((r) => r.data);

export const getMyIncidents = () => api.get("/incidents/mine").then((r) => r.data);

export const getAllIncidents = () => api.get("/incidents/all").then((r) => r.data);

export const resolveIncident = (id) =>
  api.patch(`/incidents/${id}/resolve`).then((r) => r.data);
