import express from 'express'
import cors from 'cors'
import fs from 'fs-extra' 
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import multer from 'multer';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config()



// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000
app.use(express.json({ limit: "10000mb" }));
app.use(express.urlencoded({ limit: "1000mb", extended: true }));
// Middleware

// app.use(express.json())
// app.use(bodyParser.json({ limit: "50mb" }));
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cors())

// File paths
const dataFilePath = path.join(__dirname, 'components', 'data', 'gold.json')
const animalFilePath = path.join(__dirname, 'components', 'data', 'animal.json')
const cropsFilePath = path.join(__dirname, 'components', 'data', 'crops.json')
const kccdataFilePath = path.join(__dirname, 'components', 'data', 'kccdata.json')
const kccahdataFilePath = path.join(__dirname, 'components', 'data', 'kccahdata.json')
app.get('/api/kccahdata', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kccahdata')
      .select('id, value')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    res.json(data[0]?.value || {})
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' })
  }
})



app.post('/api/kccahdata', async (req, res) => {
  try {
    console.log('✅ POST /api/kccdata HIT')
    console.log('📦 Request body keys:', Object.keys(req.body))

    const payload = req.body

    // 1️⃣ Delete old data
    const { error: deleteError } = await supabase
      .from('kccahdata')
      .delete()
      .neq('id', 0)

    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return res.status(500).json({ error: deleteError.message })
    }

    // 2️⃣ Insert new JSON
    const { data, error: insertError } = await supabase
      .from('kccahdata')
      .insert([{ value: payload }])

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return res.status(500).json({ error: insertError.message })
    }

    res.status(201).json({
      success: true,
      id: data?.[0]?.id
    })
  } catch (err) {
    console.error('🔥 Unexpected server error:', err)
    res.status(500).json({
      error: err.message || 'Unexpected error'
    })
  }
})

app.get('/api/kccdata', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kccdata')
      .select('id, value')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    res.json(data[0]?.value || {})
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' })
  }
})



app.post('/api/kccdata', async (req, res) => {
  try {
    console.log('✅ POST /api/kccdata HIT')
    console.log('📦 Request body keys:', Object.keys(req.body))

    const payload = req.body

    // 1️⃣ Delete old data
    const { error: deleteError } = await supabase
      .from('kccdata')
      .delete()
      .neq('id', 0)

    if (deleteError) {
      console.error('❌ Delete error:', deleteError)
      return res.status(500).json({ error: deleteError.message })
    }

    // 2️⃣ Insert new JSON
    const { data, error: insertError } = await supabase
      .from('kccdata')
      .insert([{ value: payload }])

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return res.status(500).json({ error: insertError.message })
    }

    res.status(201).json({
      success: true,
      id: data?.[0]?.id
    })
  } catch (err) {
    console.error('🔥 Unexpected server error:', err)
    res.status(500).json({
      error: err.message || 'Unexpected error'
    })
  }
})







// ================= GOLD ROUTES =================

// --- GET all records ---
app.get('/api/gold', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resolutions')
      .select('*')
      .order('id', { ascending: true }); // ensure order

    if (error) throw error;

    res.json(data); // send array directly
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch gold data' });
  }
});

// --- GET single record by ID ---
app.get('/api/gold/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const { data, error } = await supabase
      .from('resolutions')
      .select('*')
      .eq('id', id)
      .single(); // <-- use .single() to get one object

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Record not found' });
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching record:', err);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// --- POST create new record ---
app.post('/api/gold', async (req, res) => {
  try {
    const newRecord = req.body;

    const { data, error } = await supabase
      .from('resolutions')
      .insert([newRecord])
      .select()
      .single(); // return inserted row as object

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// --- PUT update existing record ---
app.put('/api/gold/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedRecord = req.body;

    const { data, error } = await supabase
      .from('resolutions')
      .update(updatedRecord)
      .eq('id', id)
      .select()
      .single(); // return updated row as object

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Record not found' });
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// --- DELETE a record ---
app.delete('/api/gold/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const { data, error } = await supabase
      .from('resolutions')
      .delete()
      .eq('id', id)
      .select()
      .single(); // return deleted row as object

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Record not found' });
      throw error;
    }

    res.json({ message: 'Record deleted successfully', record: data });
  } catch (err) {
    console.error('Error deleting data:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// ================= ANIMAL ROUTES =================

app.get('/api/animal', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('animal_records')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching animal data:', err);
    res.status(500).json({ error: 'Failed to fetch animal data' });
  }
});

// --- GET single record ---
app.get('/api/animal/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data, error } = await supabase
      .from('animal_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching single animal record:', err);
    res.status(500).json({ error: 'Failed to fetch animal record' });
  }
});

// --- POST new record ---
app.post('/api/animal', async (req, res) => {
  try {
    const newRecord = req.body;
    const { data, error } = await supabase
      .from('animal_records')
      .insert([newRecord])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating animal record:', err);
    res.status(500).json({ error: 'Failed to create animal record' });
  }
});

// --- PUT update record ---
app.put('/api/animal/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedRecord = req.body;

    const { data, error } = await supabase
      .from('animal_records')
      .update(updatedRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating animal record:', err);
    res.status(500).json({ error: 'Failed to update animal record' });
  }
});

// --- DELETE record ---
app.delete('/api/animal/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data, error } = await supabase
      .from('animal_records')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Animal record deleted successfully', record: data });
  } catch (err) {
    console.error('Error deleting animal record:', err);
    res.status(500).json({ error: 'Failed to delete animal record' });
  }
});

// ================= CROPS ROUTES =================

app.get('/api/crops', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crops_records')
      .select('*')
      .order('crop_code', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching crop data:', err);
    res.status(500).json({ error: 'Failed to fetch crop data' });
  }
});

// --- GET single crop ---
app.get('/api/crops/:id', async (req, res) => {
  try {
    const crop_code = parseInt(req.params.id);
    const { data, error } = await supabase
      .from('crops_records')
      .select('*')
      .eq('crop_code', crop_code)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching single crop record:', err);
    res.status(500).json({ error: 'Failed to fetch crop record' });
  }
});

// --- POST new crop ---
app.post('/api/crops', async (req, res) => {
  try {
    const newRecord = req.body;
    const { data, error } = await supabase
      .from('crops_records')
      .insert([newRecord])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating crop record:', err);
    res.status(500).json({ error: 'Failed to create crop record' });
  }
});

// --- PUT update crop ---
app.put('/api/crops/:id', async (req, res) => {
  try {
    const crop_code = parseInt(req.params.id);
    const updatedRecord = req.body;
    const { data, error } = await supabase
      .from('crops_records')
      .update(updatedRecord)
      .eq('crop_code', crop_code)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating crop record:', err);
    res.status(500).json({ error: 'Failed to update crop record' });
  }
});

// --- DELETE crop ---
app.delete('/api/crops/:id', async (req, res) => {
  try {
    const crop_code = parseInt(req.params.id);
    const { data, error } = await supabase
      .from('crops_records')
      .delete()
      .eq('crop_code', crop_code)
      .select()
      .single();
    if (error) throw error;
    res.json({ message: 'Crop record deleted successfully', record: data });
  } catch (err) {
    console.error('Error deleting crop record:', err);
    res.status(500).json({ error: 'Failed to delete crop record' });
  }
});


// ================= SUPABASE FORM SUBMIT =================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)



// ================= ROOT =================
// ================= ROOT =================
app.post("/submit-user-data", async (req, res) => {
  const {
    "உ_எண்": userId,
    "பெயர்": userName,
    "ஆதார்_எண்": aadhaar,
    userjson,
    loantype,
    isUpdate,
  } = req.body;

  console.log("📥 Incoming data:", {
    userId,
    userName,
    aadhaar,
    loantype,
    isUpdate,
  });

  try {
    let response;

    if (isUpdate) {
      // ✅ Step 1: Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("user_details")
        .select("id")
        .eq('"உ_எண்"', userId) // ✅ FIXED: Use .eq with Tamil column
        .single();

      if (fetchError || !existingUser) {
        console.error("❌ User not found for update:", fetchError || "No matching row");
        return res.status(404).json({
          message: "User not found for update",
          error: fetchError || "No user with matching உ_எண்",
        });
      }

      // ✅ Step 2: Update user
      const { data, error } = await supabase
        .from("user_details")
        .update({
          "பெயர்": userName,
          "ஆதார்_எண்": aadhaar,
          userjson,
          loantype,
        })
        .eq('"உ_எண்"', userId); // ✅ FIXED
     console.log("உ_எண்")
      if (error) {
        console.error("❌ Supabase Update Error:", error);
        return res.status(500).json({ message: "Update failed", error });
      }

      response = { message: "✅ Data updated successfully", data };
    } else {
      // ➕ Insert new user
      const { data, error } = await supabase
        .from("user_details")
        .insert([
          {
            "உ_எண்": userId,
            "பெயர்": userName,
            "ஆதார்_எண்": aadhaar,
            userjson,
            loantype,
          },
        ]);

      if (error) {
        console.error("❌ Supabase Insert Error:", error);
        return res.status(500).json({ message: "Insert failed", error });
      }

      response = { message: "✅ Data inserted successfully", data };
    }

    // ✅ Final response
    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Server crash error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


















// ================= GET USER BY ID =================
//------------------------//

//post user by id
app.post("/get-user-by-id", async (req, res) => {
  try {
    const { userId } = req.body;

    // Use double quotes around the Tamil column name
    const { data, error } = await supabase
      .from("user_details")
      .select("userjson")
      .eq('"உ_எண்"', userId) // Notice the double quotes around column name
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ userjson: data.userjson });

  } catch (err) {
    console.error("Supabase error:", err);
    return res.status(500).json({ 
      error: "Database error",
      details: err.message 
    });
  }
});
















///get user in ther

app.get("/get-all-usersAH", async (req, res) => {
  try {
    const { loantype } = req.query;

    // 1. Base query (always fetch all columns for debugging)
    let query = supabase
      .from("user_details")
      .select('*', { count: 'exact' }); // Include total count

    // 2. Case-insensitive KCC filter (if requested)
    if (loantype && loantype.toLowerCase() === 'kccah') {
      query = query.ilike('loantype', 'kccah'); // Case-insensitive search
      // Alternative if ilike fails: 
      // query = query.or(`loantype.eq.KCC,loantype.eq.kcc,loantype.eq.Kcc`)
    }

    // 3. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase Error:', { 
        message: error.message, 
        details: error.details 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    // 4. Log results for debugging
    console.log(`Fetched ${count} records`, { 
      filters: { loantype },
      firstRecord: data?.[0] 
    });

    // 5. Return data (empty array if no results)
    res.json({ 
      success: true, 
      users: data || [],
      total: count || 0 
    });

  } catch (err) {
    console.error('Server Crash:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server crashed. Check logs.' 
    });
  }
});


app.get("/get-all-users", async (req, res) => {
  try {
    const { loantype } = req.query;

    // 1. Base query (always fetch all columns for debugging)
    let query = supabase
      .from("user_details")
      .select('*', { count: 'exact' }); // Include total count

    // 2. Case-insensitive KCC filter (if requested)
    if (loantype && loantype.toLowerCase() === 'kcc') {
      query = query.ilike('loantype', 'kcc'); // Case-insensitive search
      // Alternative if ilike fails: 
      // query = query.or(`loantype.eq.KCC,loantype.eq.kcc,loantype.eq.Kcc`)
    }

    // 3. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase Error:', { 
        message: error.message, 
        details: error.details 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }

    // 4. Log results for debugging
    console.log(`Fetched ${count} records`, { 
      filters: { loantype },
      firstRecord: data?.[0] 
    });

    // 5. Return data (empty array if no results)
    res.json({ 
      success: true, 
      users: data || [],
      total: count || 0 
    });

  } catch (err) {
    console.error('Server Crash:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server crashed. Check logs.' 
    });
  }
});









//id based search
app.get("/api/user-data/:uNumber", async (req, res) => {
  const { uNumber } = req.params;
  console.log("📥 Fetching user for உ_எண்:", uNumber);

  try {
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('"உ_எண்"', uNumber)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ message: 'சேமிப்பக பிழை', details: error.message });
    }

    if (!data) {
      console.log("ℹ️ No matching user found.");
      return res.status(404).json({ message: 'பயனர் கிடைக்கவில்லை' });
    }

    // Check if user has KCC loan type
    if (data.loantype && data.loantype !== "KCC") {
      return res.status(400).json({ message: 'இந்த உ_எண் NO IN KCC ' });
    }

    console.log("✅ KCC User data retrieved:", data);
    res.status(200).json(data);
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    res.status(500).json({ message: 'உள் சேவையக பிழை', error: err.toString() });
  }
});
app.get("/api/user-data-kccah/:uNumber", async (req, res) => {
  const { uNumber } = req.params;
  console.log("📥 Fetching user for உ_எண்:", uNumber);

  try {
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('"உ_எண்"', uNumber)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ message: 'சேமிப்பக பிழை', details: error.message });
    }

    if (!data) {
      console.log("ℹ️ No matching user found.");
      return res.status(404).json({ message: 'பயனர் கிடைக்கவில்லை' });
    }

    // Check if user has KCC loan type
    if (data.loantype && data.loantype !== "KCCAH") {
      return res.status(400).json({ message: 'இந்த உ_எண் NO IN KCCAH ' });
    }

    console.log("✅ KCCAH User data retrieved:", data);
    res.status(200).json(data);
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    res.status(500).json({ message: 'உள் சேவையக பிழை', error: err.toString() });
  }
});













//image upload endpoint
// Enable CORS to allow your frontend to hit this API


// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists before multer usage

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Upload route with try-catch and explicit error forwarding
app.post('/api/upload/:docType', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Multer error or unknown error
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message || 'Upload error' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { docType } = req.params;
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: `${docType} uploaded successfully`,
      path: fileUrl,
    });
  });
});

// Fallback error handler middleware (optional)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
// ================= START SERVER =================

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`)
  console.log(process.env.NEXT_PUBLIC_API_URL)
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

})


