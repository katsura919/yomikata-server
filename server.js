const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const MANGADEX_API = "https://api.mangadex.org";

app.use(cors());
app.use(express.json());

app.get("/manga/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Manga ID is required" });

    const { data } = await axios.get(`${MANGADEX_API}/manga/${id}`, {
      params: { includes: ["cover_art", "author", "artist"] },
      headers: { "Content-Type": "application/json", "User-Agent": "Yomikata/0.1.0" },
    });

    const manga = data.data;

    const coverRel = manga.relationships.find((rel) => rel.type === "cover_art");
    const coverFileName = coverRel?.attributes?.fileName || null;
    const coverImage = coverFileName
      ? `/cover/${id}/${coverFileName}`
      : null;
   
    const authors = manga.relationships
      .filter((rel) => rel.type === "author")
      .map((rel) => rel.attributes?.name)
      .join(", ") || "Unknown";

    const artists = manga.relationships
      .filter((rel) => rel.type === "artist")
      .map((rel) => rel.attributes?.name)
      .join(", ") || "Unknown";

    const description = manga.attributes.description?.en || "No description available";
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

// New endpoint to proxy the cover image
app.get("/cover/:id/:filename", async (req, res) => {
  const { id, filename } = req.params;
  const coverUrl = `https://uploads.mangadex.org/covers/${id}/${filename}`;

  try {
    const response = await axios.get(coverUrl, {
      responseType: "arraybuffer", // Get raw image data
      headers: { "User-Agent": "Yomikata/0.1.0" }, // Avoid getting blocked
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching manga cover:", error);
    res.status(500).send("Error fetching cover image");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
