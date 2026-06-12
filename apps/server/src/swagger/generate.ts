import "dotenv/config";
import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Server API",
    description: "Auto-generated API documentation (swagger-autogen)",
  },
  host: `localhost:${process.env.PORT ?? 4000}`,
  schemes: ["http"],
};

const outputFile = "./src/swagger/swagger-output.json";
const endpointsFiles = ["./src/index.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
