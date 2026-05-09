import api from "./api.js";

export const getContacts = () => api.get("/contacts");

export const createContact = (data) => api.post("/contacts", data);

export const deleteContact = (id) => api.delete(`/contacts/${id}`);
