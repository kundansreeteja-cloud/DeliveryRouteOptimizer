const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Delivery Route Optimizer backend is running",
  });
});

app.post("/api/optimize", (req, res) => {
  const { locations, algorithm } = req.body;

  if (!locations || !Array.isArray(locations) || locations.length < 2) {
    return res.status(400).json({
      success: false,
      message: "At least 2 locations are required",
    });
  }

  res.json({
    success: true,
    message: "Optimization request received",
    algorithm: algorithm || "not specified",
    locationCount: locations.length,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});