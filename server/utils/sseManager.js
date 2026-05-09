const clients = new Map();

export const addClient = (res) => {
  clients.set(res, res);
};

export const removeClient = (res) => {
  clients.delete(res);
};

export const broadcast = (eventType, data) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients.values()) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
};
