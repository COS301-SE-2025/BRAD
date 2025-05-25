const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/report");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", authRoutes);
app.use("/", reportRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log("BRAD API running at http://localhost:3000");
});
