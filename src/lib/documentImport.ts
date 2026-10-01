/** Files remain in this browser. OCR language/WASM resources are downloaded on first use. */
export async function extractDocument(
  file: File,
  progress: (message: string) => void,
): Promise<string> {
  if (file.size > 10_000_000) throw new Error("FILE_SIZE");
  if (/\.(csv|tsv|txt)$/i.test(file.name)) return file.text();
  const { createWorker } = await import("tesseract.js");
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  const recognize = async (image: File | HTMLCanvasElement) => {
    worker ??= await createWorker("eng+deu", 1, {
      workerPath: "/import-runtime/ocr.worker.min.js",
      corePath: "/import-runtime",
      langPath: "/import-runtime",
      logger: (m) => {
        if (m.status === "recognizing text")
          progress(`${Math.round(m.progress * 100)}%`);
      },
    });
    return (await worker.recognize(image)).data.text;
  };
  try {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      const pdf = await import("pdfjs-dist");
      pdf.GlobalWorkerOptions.workerSrc = "/import-runtime/pdf.worker.min.mjs";
      const task = pdf.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
      });
      const doc = await task.promise;
      try {
        if (doc.numPages > 10) throw new Error("PDF_PAGES");
        let text = "";
        for (let i = 1; i <= doc.numPages; i++) {
          progress(`${i}/${doc.numPages}`);
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const extracted = content.items
            .map((item) =>
              "str" in item
                ? item.str + ("hasEOL" in item && item.hasEOL ? "\n" : " ")
                : "",
            )
            .join("");
          if (extracted.trim().length > 30) text += extracted + "\n";
          else {
            const viewport = page.getViewport({
              scale: Math.min(2, 1800 / page.getViewport({ scale: 1 }).width),
            });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, viewport }).promise;
            text += (await recognize(canvas)) + "\n";
            canvas.width = 0;
            canvas.height = 0;
          }
        }
        return text;
      } finally {
        await task.destroy();
      }
    }
    if (!/^image\//.test(file.type)) throw new Error("FILE_TYPE");
    const url = URL.createObjectURL(file);
    const img = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("IMAGE"));
        img.src = url;
      });
      if (img.naturalWidth * img.naturalHeight > 40_000_000)
        throw new Error("IMAGE_SIZE");
      const scale = Math.min(
        1,
        1800 / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        return await recognize(canvas);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    await worker?.terminate();
  }
}
