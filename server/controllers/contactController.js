import TrustedContact from "../models/TrustedContact.js";

export const getContacts = async (req, res) => {
  try {
    const contacts = await TrustedContact.find({ userId: req.user.id });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching contacts" });
  }
};

export const createContact = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    const hasPhone = phone && phone.trim() !== "";
    const hasEmail = email && email.trim() !== "";
    if (!hasPhone && !hasEmail) {
      return res.status(400).json({ message: "At least one of phone or email is required" });
    }

    const count = await TrustedContact.countDocuments({ userId: req.user.id });
    if (count >= 10) {
      return res.status(400).json({ message: "Maximum of 10 trusted contacts allowed" });
    }

    const contact = await TrustedContact.create({
      userId: req.user.id,
      name: name.trim(),
      phone: hasPhone ? phone.trim() : null,
      email: hasEmail ? email.trim() : null,
    });

    res.status(201).json(contact);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Error creating contact" });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await TrustedContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    if (contact.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await contact.deleteOne();
    res.json({ message: "Contact deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting contact" });
  }
};
