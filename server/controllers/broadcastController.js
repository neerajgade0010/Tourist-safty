import Broadcast from "../models/Broadcast.js";

export const createBroadcast = async (req, res) => {
  try {
    const { message, recipients } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ error: "Message cannot exceed 500 characters" });
    }

    const broadcast = await Broadcast.create({
      message: message.trim(),
      createdBy: req.user.id,
      // check the resci is array or not and if then store else left empty 
      recipients: Array.isArray(recipients) ? recipients : [],
    });

    res.status(201).json(broadcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getActiveBroadcasts = async (req, res) => {
  try {
    const userId = req.user.id;
    // Return broadcasts that are active AND (sent to all OR include this user)
    const broadcasts = await Broadcast.find({
      active: true,
      // check ker rhe hain ki ek true ho ya to sare broadcast ajaye ya to id wala 
      $or: [
        { recipients: { $size: 0 } },   // sent to all
        { recipients: userId },           // sent to this specific user
      ],
    }).sort({ createdAt: -1 });
    res.json(broadcasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: "Broadcast not found" });
// broadcast ki jo bhi active feild hain frontend main main uske equal ker dunga current feild of active in backend 
    broadcast.active = req.body.active;
    await broadcast.save();

    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: "Broadcast not found" });

    await broadcast.deleteOne();
    res.json({ message: "Broadcast deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
