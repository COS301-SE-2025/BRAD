const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const swaggerDoc = yaml.load(fs.readFileSync(path.join(__dirname, "docs/openapi.yaml"), "utf8"));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "B.R.A.D API",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js", "./docs/*.yaml"],
};

module.exports = swaggerDoc;
