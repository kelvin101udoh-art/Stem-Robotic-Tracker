import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // This tells Next.js 16 exactly where your project starts
    root: __dirname,
  },
};

export default nextConfig;
