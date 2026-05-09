import User from "../models/User.js";
import Location from "../models/Location.js";
import Alert from "../models/Alert.js";

// GET /api/admin/users — return all users without passwords
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// DELETE /api/admin/users/:id — delete user and their location record
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // cascade delete location record
    await Location.findOneAndDelete({ userId: user.email });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err.message);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// PATCH /api/admin/alerts/:id/resolve — mark alert as resolved
export const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { resolved: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.json(alert);
  } catch (err) {
    console.error("resolveAlert error:", err.message);
    res.status(500).json({ message: "Failed to resolve alert" });
  }
};
