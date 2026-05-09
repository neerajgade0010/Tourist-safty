export const getPlaceInfo = async (placeName) => {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
    );

    const data = await res.json();

    let description = data.extract;

    // ❌ FIX: handle "may refer to"
    if (!description || description.includes("may refer to")) {
      description =
        `${placeName} is a popular tourist destination known for its natural beauty, attractions, and cultural significance.`;
    }

    return {
      description,
      image: data.thumbnail?.source || ""
    };

  } catch (err) {
    console.error(err);

    return {
      description: `${placeName} is a well-known tourist destination.`,
      image: ""
    };
  }
};