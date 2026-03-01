import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/places/autocomplete", async (req, res) => {
    const { input } = req.query;
    if (!input) return res.json({ predictions: [] });

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return res.status(500).json({ error: "Google Maps API Key not configured" });

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input as string)}&types=address&key=${key}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Autocomplete error:", error);
      res.status(500).json({ error: "Failed to fetch autocomplete" });
    }
  });

  app.get("/api/places/streetview", async (req, res) => {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return res.status(500).json({ error: "Google Maps API Key not configured" });

    // We return the URL directly, but in a real app you might want to proxy the image itself
    // to hide the key from the browser. However, for a simple demo, we can proxy the request.
    try {
      const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(address as string)}&key=${key}`;
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }

      const buffer = await response.arrayBuffer();
      res.set("Content-Type", "image/jpeg");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Streetview error:", error);
      res.status(500).json({ error: "Failed to fetch streetview" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
