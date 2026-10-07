const { randomUUID } = require("node:crypto");
const { httpError } = require("../utils/httpError");
const { supabaseUrl, supabaseSecretKey } = require("../config/env");

const BUCKET = "robotactic-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function configuredStorage() {
  const projectUrl = supabaseUrl;
  const serviceKey = supabaseSecretKey;
  if (!projectUrl || !serviceKey) throw httpError(503, "Image storage is not configured. Contact the site administrator.");
  let base;
  try {
    base = new URL(projectUrl);
  } catch {
    throw httpError(503, "Image storage is not configured correctly.");
  }
  if (base.protocol !== "https:" || !base.hostname.endsWith(".supabase.co")
    || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
    throw httpError(503, "Image storage is not configured correctly.");
  }
  return { base, serviceKey };
}

function matchesSignature(buffer, mime) {
  if (mime === "image/png") {
    return buffer.length >= 45
      && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      && buffer.toString("ascii", 12, 16) === "IHDR"
      && buffer.toString("ascii", buffer.length - 8, buffer.length - 4) === "IEND";
  }
  if (mime === "image/jpeg") {
    return buffer.length >= 10 && buffer[0] === 0xff && buffer[1] === 0xd8
      && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  }
  if (mime === "image/webp") {
    return buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF"
      && buffer.toString("ascii", 8, 12) === "WEBP"
      && buffer.readUInt32LE(4) === buffer.length - 8;
  }
  return false;
}

async function uploadImage(resource, buffer, contentType) {
  const mime = String(contentType || "").split(";", 1)[0].trim().toLowerCase();
  if (!IMAGE_TYPES[mime]) throw httpError(415, "Upload a JPEG, PNG, or WebP image.");
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw httpError(400, "Choose an image to upload.");
  if (buffer.length > MAX_IMAGE_BYTES) throw httpError(413, "Image must be 5 MB or smaller.");
  if (!matchesSignature(buffer, mime)) throw httpError(400, "The file does not match a valid supported image format.");

  const { base, serviceKey } = configuredStorage();
  const objectPath = `${resource}/${randomUUID()}.${IMAGE_TYPES[mime]}`;
  const uploadUrl = new URL(`/storage/v1/object/${BUCKET}/${objectPath}`, base);
  let result;
  try {
    result = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        ...(serviceKey.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${serviceKey}` }),
        "Content-Type": mime,
        "Cache-Control": "max-age=31536000",
      },
      body: buffer,
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw httpError(502, "Image storage is temporarily unavailable. Try again.");
  }
  const uploaded = result.ok;
  await result.body?.cancel().catch(() => {});
  if (!uploaded) throw httpError(502, "Could not store the image. Check the storage setup and try again.");
  return { url: new URL(`/storage/v1/object/public/${BUCKET}/${objectPath}`, base).toString() };
}

module.exports = { BUCKET, MAX_IMAGE_BYTES, IMAGE_TYPES, uploadImage };
