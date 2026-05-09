import mongoose from "mongoose";

const incidentReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["theft", "accident", "harassment", "other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
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

incidentReportSchema.index({ lat: 1, lng: 1 });
incidentReportSchema.index({ resolved: 1 });

export default mongoose.model("IncidentReport", incidentReportSchema);
