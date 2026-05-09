export const getBotResponse = (input, context) => {
  const text = input.toLowerCase();

  if (text.includes("hi") || text.includes("hello")) {
    return { reply: "Hello 👋 How can I assist you today?", action: null };
  }

  if (text.includes("hospital") || text.includes("clinic") || text.includes("medical")) {
    return { reply: "🏥 Showing nearby hospitals on the map.", action: "SHOW_HOSPITALS" };
  }

  if (text.includes("police") || text.includes("station") || text.includes("cop")) {
    return { reply: "🚓 Showing nearby police stations on the map.", action: "SHOW_POLICE" };
  }

  if (text.includes("risk") || text.includes("danger") || text.includes("unsafe") || text.includes("crime")) {
    return { reply: "🚨 Highlighting risk zones on the map.", action: "SHOW_RISK" };
  }

  if (text.includes("route") || text.includes("direction") || text.includes("navigate") || text.includes("how to get")) {
    return { reply: "🛣 Search a destination in the search bar and the route will appear on the map.", action: null };
  }

  if (text.includes("emergency") || text.includes("sos") || text.includes("help me")) {
    return { reply: "🚨 Press the red Emergency button on the map to send an SOS alert and get routed to the nearest hospital immediately!", action: null };
  }

  if (text.includes("safe") || text.includes("safety score")) {
    return { reply: "🛡 Safety scores are shown in the place details panel after you search a location. Higher is safer!", action: null };
  }

  if (text.includes("share") || text.includes("location")) {
    return { reply: "📍 Use the Share Location button to send your live location link to someone you trust.", action: null };
  }

  // AI fallback
  return { reply: "default", action: null };
};
