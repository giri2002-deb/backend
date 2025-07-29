// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

// Supabase client

const supabaseUrl = "https://nwpqgdczjhykpfumkkcu.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cHFnZGN6amh5a3BmdW1ra2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDk1MDAsImV4cCI6MjA2NjY4NTUwMH0.o0XbFpd6dE1hbR5fpewYWpG-ZhB-8EFMpabRMNgWwMg"; // Replace with full key
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Admin login route
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase
    .from("adminlogin")
    .select("*")
    .eq("mail", email)
    .eq("password", password)
    .maybeSingle();

  if (error || !data) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  return res.json({ success: true, message: "Login successful" });
});

// ✅ Get all sarees
app.get("/api/sarees", async (req, res) => {
  const { data, error } = await supabase
    .from("sarees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sarees:", error.message);
    return res.status(500).json({ error: "Failed to fetch sarees" });
  }

  res.json(data);
});

// ✅ Get single saree by ID
app.get("/api/sarees/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("sarees")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ error: "Saree not found" });
  }

  res.json(data);
});

// ✅ Create new saree
app.post("/api/sarees", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      originalPrice,
      image,
      images,
      description,
      features,
      isNew,
      isFeatured,
      rating,
      stack,
    } = req.body;

    const { data, error } = await supabase
      .from("sarees")
      .insert([
        {
          name,
          category,
          price,
          original_price: originalPrice,
          image,
          images,
          description,
          features,
          is_new: isNew,
          is_featured: isFeatured,
          rating,
          stack,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error creating saree:", error.message);
      return res
        .status(500)
        .json({ error: "Failed to create saree", details: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update saree
app.put("/api/sarees/:id", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      originalPrice,
      image,
      images,
      description,
      features,
      isNew,
      isFeatured,
      rating,
      stack,
    } = req.body;

    const { data, error } = await supabase
      .from("sarees")
      .update({
        name,
        category,
        price,
        original_price: originalPrice,
        image,
        images,
        description,
        features,
        is_new: isNew,
        is_featured: isFeatured,
        rating,
        updated_at: new Date(),
        stack,
      })
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error || !data) {
      return res
        .status(404)
        .json({
          error: "Saree not found or update failed",
          details: error?.message,
        });
    }

    res.json(data);
  } catch (err) {
    console.error("Unexpected error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Delete saree
app.delete("/api/sarees/:id", async (req, res) => {
  const { error } = await supabase
    .from("sarees")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    console.error("Error deleting saree:", error.message);
    return res.status(500).json({ error: "Delete failed" });
  }

  res.status(204).send();
});
//hero section
app.post("/api/hero-slides", async (req, res) => {
  const { title, highlight, description, image_url } = req.body;

  const { data, error } = await supabase
    .from("hero_slides")
    .insert([{ title, highlight, description, image_url }]);

  if (error) {
    return res.status(500).json({ message: "Insert failed", error });
  }

  res.status(200).json({ message: "Slide inserted successfully", data });
});

// ✅ GET route to fetch hero slides
app.get("/api/hero-slides", async (req, res) => {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Fetch failed", error });
  }

  res.status(200).json(data);
});

//  admin Fetch all slides
app.get("/api/admin/hero-slides", async (req, res) => {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id, title, highlight, description, image_url")
    .order("id");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Add new slide
// ✅ GET all hero slides
app.get("/api/admin/hero-slides", async (req, res) => {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("id");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ POST a new slide
const BUCKET = "hero-images"; // ✅ Confirmed bucket
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Get all hero slides
app.get("/api/admin/hero-slides", async (req, res) => {
  const { data, error } = await supabase.from("hero_slides").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Add new slide
app.post("/api/admin/update-hero-slides", async (req, res) => {
  const { title, highlight, description, image_url } = req.body;
  const { data, error } = await supabase
    .from("hero_slides")
    .insert([{ title, highlight, description, image_url }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Update existing slide
app.put("/api/hero-slides/:id", async (req, res) => {
  const { id } = req.params;
  const { title, highlight, description, image_url } = req.body;

  const { data, error } = await supabase
    .from("hero_slides")
    .update({ title, highlight, description, image_url })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Upload new image
app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Image upload failed" });
  }
});
//fetured section

app.get("/api/featured-products", async (req, res) => {
  const { data, error } = await supabase
    .from("sarees")
    .select("*")
    .eq("addin", "featured") // 🟡 note: match your Supabase spelling
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Error fetching featured sarees:", error.message);
    return res.status(500).json({ error: "Failed to fetch featured products" });
  }

  res.json(data);
});
//-----------------------------------
//fetured admin

app.get("/api/featured-products", async (req, res) => {
  const { data, error } = await supabase
    .from("sarees")
    .select("*")
    .eq("addin", "featured") // 🟡 note: match your Supabase spelling
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Error fetching featured sarees:", error.message);
    return res.status(500).json({ error: "Failed to fetch featured products" });
  }

  res.json(data);
});
//-----------------------------------
//fetured admin

const storage = multer.memoryStorage();
const upload1 = multer({ storage });

// ✅ GET all featured products
app.get("/api/featured-products", async (req, res) => {
  const { data, error } = await supabase
    .from("sarees")
    .select("*")
    .eq("addin", "featured")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ POST new featured product
app.post(
  "/api/products/featured",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        price,
        originalPrice = price,
        category,
        description = "",
      } = req.body;

      const mainImageFile = req.files?.["image"]?.[0];
      const galleryFiles = req.files?.["images"] || [];

      if (!mainImageFile)
        return res.status(400).json({ error: "Main image is required" });

      // 📤 Upload main image
      const mainFileName = `main-${Date.now()}${path.extname(mainImageFile.originalname)}`;
      const { error: mainErr } = await supabase.storage
        .from(BUCKET)
        .upload(mainFileName, mainImageFile.buffer, {
          contentType: mainImageFile.mimetype,
          upsert: true,
        });

      if (mainErr) return res.status(500).json({ error: mainErr.message });

      const { data: mainUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(mainFileName);

      // 📤 Upload gallery images
      const galleryUrls = [];
      for (const file of galleryFiles) {
        const filename = `gallery-${Date.now()}-${file.originalname}`;
        const { error: galleryErr } = await supabase.storage
          .from(BUCKET)
          .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (!galleryErr) {
          const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filename);
          galleryUrls.push(urlData.publicUrl);
        }
      }

      // 🧾 Insert product
      const { data, error: insertErr } = await supabase
        .from("sarees")
        .insert([
          {
            name,
            price: parseFloat(price),
            original_price: parseFloat(originalPrice),
            category,
            description,
            image: mainUrlData.publicUrl,
            images: galleryUrls,
            addin: "featured",
            created_at: new Date(),
          },
        ])
        .select();

      if (insertErr) return res.status(500).json({ error: insertErr.message });

      res.status(201).json(data);
    } catch (err) {
      console.error("❌ POST error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ✅ PUT update product (metadata only)
app.put("/api/products/featured/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("sarees")
    .update(req.body)
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ DELETE product and remove images
app.delete("/api/products/featured/:id", async (req, res) => {
  const { id } = req.params;

  const { data: product, error: fetchErr } = await supabase
    .from("sarees")
    .select("image, images")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(404).json({ error: "Product not found" });

  try {
    const toDelete = [];

    if (product.image) {
      const mainFile = decodeURIComponent(product.image.split("/").pop());
      toDelete.push(mainFile);
    }

    if (product.images?.length) {
      const galleryFiles = product.images.map((url) =>
        decodeURIComponent(url.split("/").pop()),
      );
      toDelete.push(...galleryFiles);
    }

    if (toDelete.length > 0) {
      await supabase.storage.from(BUCKET).remove(toDelete);
    }

    const { error: deleteErr } = await supabase
      .from("sarees")
      .delete()
      .eq("id", id);

    if (deleteErr) return res.status(500).json({ error: deleteErr.message });

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("❌ DELETE error:", err.message);
    res.status(500).json({ error: "Error deleting product" });
  }
});
//add in saree
// PUT: Update addin from 'featured' → 'sarees' and set stock value
// PUT: convert featured to saree and set stock
app.put("/api/products/convert/:id", async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const { data, error } = await supabase
    .from("sarees")
    .update({ addin: "sarees", stack: parseInt(stock) })
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});