import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
