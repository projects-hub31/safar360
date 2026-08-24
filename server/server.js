const express = require("express");
const PORT = process.env.PORT || 5000;

// create Instance of express
const app = express();

app.use(express.json());

// define routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
