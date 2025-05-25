const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const swaggerDoc = yaml.load(
  fs.readFileSync(path.join(__dirname, "docs/openapi.yaml"), "utf8")
);

module.exports = swaggerDoc;
