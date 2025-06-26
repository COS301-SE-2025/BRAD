const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, './docs/openapi.yaml');
const fileContents = fs.readFileSync(filePath, 'utf8');
const swaggerDoc = yaml.load(fileContents);

module.exports = swaggerDoc;
