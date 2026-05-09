import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Empty array = all users. Non-empty = only these user IDs see it
    recipients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

broadcastSchema.index({ active: 1 });

export default mongoose.model("Broadcast", broadcastSchema);
