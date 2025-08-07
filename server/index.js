// loading the environment variables
require("dotenv").config();

// express and cors instances
const compression = require("compression");
const express = require("express");
const app = express();
const cors = require("cors");

//mongoDB Connection
require("./config/db/connection");

// server port
const port = process.env.PORT || 4000;

// importing the routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const formRoutes = require("./routes/formRoutes");
const responseRoutes = require("./routes/responseRoutes");

//Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(compression());

//Root route
app.get("/", (req, res) => {
  res.send("CanovaForm Backend API is running...");
});

//application routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/responses", responseRoutes);

//starting the sever
app.listen(port, () => {
  console.log(`Server is running at port : ${port}`);
});
