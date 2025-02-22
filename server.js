const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const MANGADEX_API = "https://api.mangadex.org";

app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests

app.get("/manga/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Manga ID is required" });

    const { data } = await axios.get(`${MANGADEX_API}/manga/${id}`, {
      params: { includes: ["cover_art", "author", "artist"] },
      headers: { "Content-Type": "application/json", "User-Agent": "Yomikata/0.1.0" },
    });

    const manga = data.data;

    // Extract cover image
    const coverRel = manga.relationships.find((rel) => rel.type === "cover_art");
    const coverImage = coverRel?.attributes?.fileName
      ? `https://uploads.mangadex.org/covers/${id}/${coverRel.attributes.fileName}`
      : null;

    // Extract author(s) and artist(s)
    const authors = manga.relationships
      .filter((rel) => rel.type === "author")
      .map((rel) => rel.attributes?.name)
      .join(", ") || "Unknown";

    const artists = manga.relationships
      .filter((rel) => rel.type === "artist")
      .map((rel) => rel.attributes?.name)
      .join(", ") || "Unknown";

    // Extract description (fallback to "No description available")
    const description = manga.attributes.description?.en || "No description available";

    // Extract all alternative titles
    const altTitles = manga.attributes.altTitles
      ?.flatMap((titleObj) => Object.values(titleObj)) || [];

    const formattedData = {
      id: manga.id,
      title: manga.attributes.title?.en || "No Title",
      author: authors,
      artist: artists,
      contentRating: manga.attributes.contentRating || "Unknown",
      tags: manga.attributes.tags?.map((tag) => tag.attributes?.name?.en) || [],
      coverImage,
      publication: manga.attributes.publicationDemographic || "Unknown",
      description,
      altTitles,
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching manga details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
