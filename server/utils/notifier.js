import nodemailer from "nodemailer";
import TrustedContact from "../models/TrustedContact.js";
import User from "../models/User.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const notifyContacts = async (alert) => {
  let user = null;
  try {
    user = await User.findById(alert.userId);
  } catch {
    user = await User.findOne({ email: alert.userId });
  }

  const userIdentifier = user?.email || alert.userId;
  const trackingLink = `${process.env.APP_BASE_URL || "http://localhost:5173"}/track/${alert.userId}`;

  let contacts = [];
  try {
    const query = user ? { userId: user._id } : {};
    contacts = await TrustedContact.find(query);
  } catch (err) {
    console.error("Failed to fetch trusted contacts:", err);
    return;
  }

  for (const contact of contacts) {
    if (!contact.email) continue;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: contact.email,
        subject: "🚨 SOS Alert",
        text: `Emergency alert from ${userIdentifier}.\n\nTrack their location: ${trackingLink}`,
        html: `<p>Emergency alert from <strong>${userIdentifier}</strong>.</p><p><a href="${trackingLink}">Track their location</a></p>`,
      });
    } catch (err) {
      console.error(`Failed to notify contact ${contact.email}:`, err);
    }
  }
};
