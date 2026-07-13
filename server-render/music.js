// music.js — async AI background-music generation job for the render
// worker.
//
// This mirrors render.js's Replicate-prediction-then-upload shape (and the
// same version-hash-vs-model-by-name branching as
// base44/functions/generateMusic/entry.ts), but runs as its own job kind
// through index.js's async job queue instead of inside a synchronous Base44
// function call — that old path was hitting the function gateway's timeout
// for anything but very short clips. Running here, on a long-lived worker
// process rather than a gated function invocation, this can afford a much
// more generous poll budget.

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000; // ~120s — generous, since this isn't racing a function gateway timeout

const DEFAULT_MODEL = "meta/musicgen";
const DEFAULT_MODEL_VERSION = "stereo-large";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same branching as generateMusic/entry.ts's createReplicatePrediction:
// "owner/model" (no version hash) uses the model-by-name endpoint (always
// runs the latest pushed version); "owner/model:versionhash" falls back to
// the generic /v1/predictions endpoint, the only one that accepts an
// explicit pinned version.
async function createReplicatePrediction(model, token, prompt, duration, modelVersion) {
  const input = {
    prompt,
    model_version: modelVersion || DEFAULT_MODEL_VERSION,
    duration,
    output_format: "mp3",
  };

  const versionHashIndex = model.indexOf(":");
  const hasVersionHash = versionHashIndex !== -1;

  const url = hasVersionHash
    ? "https://api.replicate.com/v1/predictions"
    : `https://api.replicate.com/v1/models/${model}/predictions`;

  const body = hasVersionHash
    ? { version: model.slice(versionHashIndex + 1), input }
    : { input };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => `${res.status} ${res.statusText}`);
    throw new Error(`Replicate prediction creation failed: ${detail}`);
  }
  return res.json();
}

// Same BASE44_UPLOAD_URL/BASE44_UPLOAD_TOKEN approach as render.js's
// uploadResult — downloads the Replicate-hosted result and re-uploads it to
// Base44 storage so the caller gets back a persistent, durable URL rather
// than a link into Replicate's own (temporary) storage.
async function uploadToBase44(audioUrl) {
  const uploadUrl = process.env.BASE44_UPLOAD_URL;
  const uploadToken = process.env.BASE44_UPLOAD_TOKEN;
  if (!uploadUrl) throw new Error("BASE44_UPLOAD_URL is not configured.");

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to download generated audio (${audioRes.status} ${audioRes.statusText})`);
  }
  const buffer = Buffer.from(await audioRes.arrayBuffer());
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "audio/mpeg" }), "ai-background-music.mp3");

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${uploadToken}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => `${res.status} ${res.statusText}`);
    throw new Error(`Upload to Base44 failed: ${detail}`);
  }
  const data = await res.json();
  if (!data?.file_url) throw new Error("Upload succeeded but the response had no file_url.");
  return data.file_url;
}

/**
 * generateMusicJob(spec, onProgress) — creates a Replicate music-generation
 * prediction from spec = { prompt, durationSeconds, model_version }, polls
 * it to completion, uploads the result to Base44, and returns the
 * persistent file_url.
 */
export async function generateMusicJob(spec, onProgress = () => {}) {
  // BYOK (Work Package F): a user's own Replicate token, forwarded by the
  // submitMusic Base44 function, takes priority over the platform token so
  // the job bills the user's account instead of the platform's.
  const token = spec?.byok?.replicateToken || process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not configured.");
  const model = process.env.REPLICATE_MUSIC_MODEL || DEFAULT_MODEL;

  onProgress(0);

  const prompt = spec?.prompt?.trim() || "cinematic instrumental background music";
  const duration = Math.max(1, Number(spec?.durationSeconds) || 30);

  let prediction = await createReplicatePrediction(model, token, prompt, duration, spec?.model_version);
  onProgress(0.1);

  const startedAt = Date.now();
  const deadline = startedAt + POLL_TIMEOUT_MS;

  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for Replicate music generation to finish.");
    }
    await sleep(POLL_INTERVAL_MS);

    const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
    const pollRes = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!pollRes.ok) {
      const detail = await pollRes.text().catch(() => `${pollRes.status} ${pollRes.statusText}`);
      throw new Error(`Replicate polling failed: ${detail}`);
    }
    prediction = await pollRes.json();

    // Replicate doesn't expose a real completion percentage for this
    // model — approximate with elapsed-time-over-budget instead.
    onProgress(Math.min(0.85, 0.1 + ((Date.now() - startedAt) / POLL_TIMEOUT_MS) * 0.75));
  }

  if (prediction.status !== "succeeded") {
    // Surface Replicate's own error text verbatim, same as
    // generateMusic/entry.ts — a billing/credit error should reach the
    // caller exactly as Replicate phrased it.
    const providerMessage = prediction.error ? String(prediction.error) : "no further detail from the provider";
    throw new Error(`Replicate generation ${prediction.status}: ${providerMessage}`);
  }

  const output = prediction.output;
  const audioUrl = Array.isArray(output) ? output[0] : output;
  if (!audioUrl || typeof audioUrl !== "string") {
    throw new Error("Replicate finished successfully but returned no audio URL.");
  }
  onProgress(0.9);

  const fileUrl = await uploadToBase44(audioUrl);
  onProgress(1);
  return fileUrl;
}
