import { motion } from "framer-motion";

const ShareModal = ({ link, onClose }) => {

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${link}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1f2937] p-6 rounded-2xl w-[320px]"
      >
        <h2 className="text-lg mb-4 text-center">📤 Share Location</h2>

        <div className="flex justify-around mb-4">
          <button onClick={shareWhatsApp}>🟢 WhatsApp</button>
          <button onClick={shareFacebook}>🔵 Facebook</button>
          <button onClick={shareTwitter}>⚫ Twitter</button>
        </div>

        <input
          value={link}
          readOnly
          className="w-full p-2 rounded bg-gray-800 mb-3"
        />

        <button
          onClick={copyLink}
          className="w-full bg-blue-500 p-2 rounded"
        >
          Copy Link
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 text-red-400"
        >
          Close
        </button>
      </motion.div>

    </div>
  );
};

export default ShareModal;