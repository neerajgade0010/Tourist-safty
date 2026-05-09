import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { getContacts, createContact, deleteContact } from "../services/contactService";
import { buildWhatsAppLink } from "../utils/whatsappLink";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function EmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = async () => {
    try { const res = await getContacts(); setContacts(res.data); setFetchError(null); }
    catch { setFetchError("Failed to load contacts."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(); }, []);

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.phone.trim() && !form.email.trim()) return "Provide at least a phone number or email.";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return "Invalid email format.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(); if (err) { setFormError(err); return; }
    setFormError(null); setSubmitting(true);
    try {
      await createContact({ name: form.name.trim(), phone: form.phone.trim() || undefined, email: form.email.trim() || undefined });
      setForm({ name: "", phone: "", email: "" }); await fetchContacts();
    } catch (err) { setFormError(err.response?.data?.message || "Failed to add contact."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteContact(id); setContacts((p) => p.filter((c) => c._id !== id)); }
    catch { alert("Failed to delete contact."); }
  };

  const trackingLink = `${window.location.origin}/track/${user?.email || ""}`;

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-orange-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">Emergency Contacts</h1>
            <p className="text-gray-500 text-sm">Notified instantly when you trigger SOS</p>
          </div>
        </div>

        {/* Add contact form */}
        <form onSubmit={handleSubmit} className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-base font-semibold mb-5 text-gray-200">Add New Contact</h2>
          <div className="space-y-4">
            {[
              { label: "Name *", name: "name", type: "text", placeholder: "Full name" },
              { label: "Phone (optional)", name: "phone", type: "tel", placeholder: "+91 98765 43210" },
              { label: "Email (optional)", name: "email", type: "email", placeholder: "contact@example.com" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">{f.label}</label>
                <input type={f.type} value={form[f.name]} onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition" />
              </div>
            ))}
          </div>

          <AnimatePresence>
            {formError && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5 flex items-center gap-2">
                ⚠️ {formError}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={submitting}
            className="mt-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition shadow-lg shadow-orange-500/20">
            {submitting ? "Adding..." : "Add Contact"}
          </button>
        </form>

        {/* Contact list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">Your Contacts</p>
            <span className="text-xs text-gray-600 border border-white/10 px-2.5 py-1 rounded-full">{contacts.length}/10</span>
          </div>

          {loading && <p className="text-gray-600 text-sm text-center py-8">Loading...</p>}
          {fetchError && <p className="text-red-400 text-sm text-center py-4">{fetchError}</p>}
          {!loading && contacts.length === 0 && !fetchError && (
            <div className="text-center py-12 text-gray-700">
              <p className="text-4xl mb-2 opacity-30">📋</p>
              <p className="text-sm">No contacts yet</p>
              <p className="text-xs mt-1 text-gray-800">Add trusted people who'll be notified on SOS</p>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {contacts.map((c) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between gap-4 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-lg shrink-0">
                      {c.phone ? "📞" : "✉️"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                      {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.phone && (
                      <a href={buildWhatsAppLink(c.phone, trackingLink, user?.email || "User")} target="_blank" rel="noopener noreferrer"
                        className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs px-3 py-1.5 rounded-xl transition">
                        WhatsApp
                      </a>
                    )}
                    <button onClick={() => handleDelete(c._id)}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs px-3 py-1.5 rounded-xl transition">
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
