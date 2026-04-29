import { compressFonts, updateCssFontReferences } from "./font-output.js";

// Folder entrypoint: run the same two-stage build as the historical root script.
await compressFonts();
await updateCssFontReferences();
