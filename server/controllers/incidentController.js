import IncidentReport from "../models/IncidentReport.js";

const VALID_TYPES = ["theft", "accident", "harassment", "other"];

export const createIncident = async (req, res) => {
  try {
    const { type, description, lat, lng } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid incident type" });
    }
    if (!description || description.length < 10) {
      return res.status(400).json({ error: "Description must be at least 10 characters" });
    }

    const incident = await IncidentReport.create({
      userId: req.user.id,
      type,
      description,
      lat,
      lng,
    });

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getIncidents = async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng } = req.query;

    const incidents = await IncidentReport.find({
      resolved: false,
      lat: { $gte: Number(swLat), $lte: Number(neLat) },
      lng: { $gte: Number(swLng), $lte: Number(neLng) },
    }).sort({ createdAt: -1 });

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllIncidents = async (req, res) => {
  try {
    const incidents = await IncidentReport.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resolveIncident = async (req, res) => {
  try {
    const incident = await IncidentReport.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );

    if (!incident) return res.status(404).json({ error: "Incident not found" });

    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/incidents/mine — current user's own reports
export const getMyIncidents = async (req, res) => {
  try {
    const incidents = await IncidentReport.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
