import Alert from "../models/Alert.js";
import { broadcast } from "../utils/sseManager.js";
import { notifyContacts } from "../utils/notifier.js";

// 🚨 CREATE ALERT
export const createAlert = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;

    const alert = await Alert.create({
      userId,
      lat,
      lng
    });

    res.json({ message: "Alert sent", alert });

    setImmediate(() => {
      broadcast("sos", {
        userId: alert.userId,
        userEmail: alert.userId,
        lat: alert.lat,
        lng: alert.lng,
        createdAt: alert.createdAt,
      });
      notifyContacts(alert).catch((err) =>
        console.error("notifyContacts error:", err)
      );
    });

  } catch (err) {
    res.status(500).json({ message: "Error creating alert" });
  }
};

// 📡 GET ALL ALERTS
export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching alerts" });
  }
};