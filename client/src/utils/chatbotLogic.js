export const getBotResponse = (input, context) => {
  const text = input.toLowerCase();

  // Helper function to match whole words or phrases
  const match = (words) => new RegExp(`\\b(${words.join('|')})\\b`, 'i').test(text);

  // Greetings
  if (match(["hi", "hello", "hey"])) {
    return { reply: "Hello 👋 How can I assist you today? Ask me about tourist places, safety, hospitals, or directions!", action: null };
  }

  // Hospitals
  if (match(["hospital", "clinic", "medical", "doctor", "ambulance", "hospitals", "clinics", "doctors"])) {
    return { reply: "🏥 Showing nearby hospitals on the map. Click any marker for details.", action: "SHOW_HOSPITALS" };
  }

  // Police
  if (match(["police", "station", "cop", "security", "cops", "stations"])) {
    return { reply: "🚓 Showing nearby police stations on the map.", action: "SHOW_POLICE" };
  }

  // Risk zones
  if (match(["risk", "danger", "unsafe", "crime", "safe area", "avoid", "risks"])) {
    return { reply: "🚨 Highlighting risk zones on the map. Red circles show dangerous areas — hover to see details.", action: "SHOW_RISK" };
  }

  // Navigation
  if (match(["route", "direction", "navigate", "how to get", "how to reach", "way to", "directions", "routes"])) {
    return { reply: "🛣 Use the search bar at the top to search your destination. The route will appear on the map automatically.", action: null };
  }

  // Emergency
  if (match(["emergency", "sos", "help me", "accident", "injured"])) {
    return { reply: "🚨 Press the red Emergency button on the map for instant SOS! It alerts admin and routes you to the nearest hospital. Emergency: 112 | Police: 100 | Ambulance: 108", action: null };
  }

  // Safety score
  if (match(["safe", "safety score", "is it safe", "safety"])) {
    return { reply: "🛡 Search any tourist place to see its safety score (60-99). Higher score = safer area.", action: null };
  }

  // Share location
  if (match(["share", "track", "live location", "tracking"])) {
    return { reply: "📍 Use the Share Location button to send your live tracking link to family or friends.", action: null };
  }

  // Hotels / stays / accommodation
  if (match(["hotel", "stay", "accommodation", "resort", "hostel", "lodge", "hotels", "stays", "resorts", "hostels"])) {
    return { reply: "🏨 For hotels and stays, I recommend checking Google Maps or Booking.com. Use the search bar to navigate to your destination first, then look for nearby accommodations.", action: null };
  }

  // Food / restaurants
  if (match(["food", "restaurant", "eat", "dining", "cafe", "restaurants", "cafes"])) {
    return { reply: "🍽 For restaurants and food, search your location on the map and look for nearby dining options. Always prefer well-reviewed places in tourist areas.", action: null };
  }

  // Tourist places / attractions
  if (match(["tourist", "attraction", "visit", "sightseeing", "famous", "place", "places", "attractions"])) {
    return { reply: "📍 Use the search bar to find any tourist destination. I'll show you the place details, description, safety score, and navigation route!", action: null };
  }

  // Weather
  if (match(["weather", "temperature", "rain", "climate", "raining"])) {
    return { reply: "🌤 For weather updates, check the local weather app or Google. Always carry rain gear in hill stations like Shimla, Manali, and Dharamshala!", action: null };
  }

  // Transport
  if (match(["bus", "train", "taxi", "cab", "transport", "auto", "buses", "trains", "cabs", "autos"])) {
    return { reply: "🚕 Always use registered taxis or verified ride-sharing apps like Ola/Uber. Avoid unmarked vehicles especially at night.", action: null };
  }

  // Tips
  if (match(["tip", "advice", "suggest", "recommend", "tips", "suggestions", "advice"])) {
    return { reply: "💡 Top safety tips: 1) Share your live location with family 2) Keep emergency numbers saved 3) Avoid isolated areas at night 4) Use registered transport 5) Keep documents safe.", action: null };
  }

  // AI fallback — give a helpful response without needing AI
  return {
    reply: `I can help you with safety information! Try asking about:\n🏥 Hospitals nearby\n🚓 Police stations\n🚨 Risk zones\n🛣 Directions & routes\n🏨 Hotels & stays\n🍽 Food & restaurants\n🌤 Weather tips\n🚕 Transport safety\n💡 Safety tips`,
    action: null
  };
};
