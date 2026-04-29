import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared absolute paths keep moved modules independent from their file depth.
export const COMPRESS_FONTS_DIR = __dirname;
export const PROJECT_ROOT = path.resolve(__dirname, "../..");
