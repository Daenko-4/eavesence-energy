import { copyFile, mkdir } from "node:fs/promises";
await mkdir("public/import-runtime", { recursive: true });
await copyFile(
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "public/import-runtime/pdf.worker.min.mjs",
);
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  "public/import-runtime/ocr.worker.min.js",
);
import { readdir } from "node:fs/promises";
for (const name of await readdir("node_modules/tesseract.js-core")) {
  if (name.endsWith(".wasm") || name.endsWith(".wasm.js"))
    await copyFile(
      `node_modules/tesseract.js-core/${name}`,
      `public/import-runtime/${name}`,
    );
}
for (const lang of ["eng", "deu"])
  await copyFile(
    `node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,
    `public/import-runtime/${lang}.traineddata.gz`,
  );
