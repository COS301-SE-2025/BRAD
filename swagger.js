const swaggerJsdoc = require("swagger-jsdoc");

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

module.exports = swaggerJsdoc(options);
