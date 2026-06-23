import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

// Start server
const PORT: number = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
