import mongoose from "mongoose";

const trustedContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

trustedContactSchema.pre("validate", function (next) {
  const hasPhone = this.phone && this.phone.trim() !== "";
  const hasEmail = this.email && this.email.trim() !== "";
  if (!hasPhone && !hasEmail) {
    const err = new mongoose.Error.ValidationError(this);
    err.errors["contact"] = new mongoose.Error.ValidatorError({
      message: "At least one of phone or email is required",
      path: "contact",
    });
    return next(err);
  }
  next();
});

export default mongoose.model("TrustedContact", trustedContactSchema);
