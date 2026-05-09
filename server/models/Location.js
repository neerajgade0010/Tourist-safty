import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  userId: String,
  lat: Number,
  lng: Number,
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isSharing: {
  type: Boolean,
  default: true
}
});

export default mongoose.model("Location", locationSchema);