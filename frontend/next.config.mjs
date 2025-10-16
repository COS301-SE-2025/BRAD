import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("./.env") });
const API_TARGET = process.env.API_URL || "http://api:3000";


/** @type { import('next').NextConfig } */
const nextConfig = {
    async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_TARGET}/:path*` },
    ];
  },

};

export default nextConfig;
