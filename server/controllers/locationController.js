import Location from "../models/Location.js";

// 🔥 LIVE UPDATE LOCATION
export const updateLocation = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;

    let user = await Location.findOne({ userId });

    if (user) {
      user.lat = lat;
      user.lng = lng;
      user.updatedAt = Date.now();
      user.isSharing = true; // ✅ IMPORTANT: mark active again
      await user.save();
    } else {
      await Location.create({ userId, lat, lng, isSharing: true });
    }

    res.json({ message: "Location updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating location" });
  }
};

// 📍 GET ALL USERS LOCATION
export const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: "Error fetching locations" });
  }
};

// 📍 GET SINGLE USER LOCATION
export const getUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Location.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Error fetching location" });
  }
};

// 🛑 STOP SHARING
export const stopSharing = async (req, res) => {
  try {
    const { userId } = req.body;

    await Location.findOneAndUpdate(
      { userId },
      { isSharing: false }
    );

    res.json({ message: "Sharing stopped" });
  } catch (err) {
    res.status(500).json({ message: "Error stopping sharing" });
  }
};