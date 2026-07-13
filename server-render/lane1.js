// lane1.js — FFmpeg finishing pipeline for Lane 1 (Base44-native short
// video: Quick Create, Campaign Studio, Demo Video Maker). Lane 1 keeps
// generating its images/voiceover/music the Base44-native way (generateImage,
// generateVoiceover, generateMusic) — this module only replaces the final
// assembly step, which used to happen client-side via Canvas+MediaRecorder
// (src/utils/videoAssembler.js, WebM/VP9, no real encode control). No
// Replicate calls here — this is pure FFmpeg muxing/encoding, the same
// binary render.js (Lane 2) already uses, just a separate, simpler pipeline
// so Lane 2/Movie Maker's behavior is untouched.
//
// Structurally this mirrors render.js closely (Ken Burns per-scene clips ->
// concat demuxer -> upload), duplicated rather than imported — same
// small-helpers-per-module convention every file in this directory already
// follows. It's simpler than render.js in two ways (no title card, no
// per-scene voice/video-clip branching) and adds one thing render.js
// doesn't have: a dedicated finishing pass (contrast/saturation normalize +
// loudnorm + the final high-quality encode).

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

// "1080p" is the default/recommended tier; "720p" is the lighter option —
// selectable per the resolution selector in Quick Create/Campaign
// Studio/Demo Video Maker.
const RESOLUTIONS = {
  "1080p": {
    "16:9": { w: 1920, h: 1080 },
    "9:16": { w: 1080, h: 1920 },
    "1:1": { w: 1080, h: 1080 },
    "4:5": { w: 1080, h: 1350 },
  },
  "720p": {
    "16:9": { w: 1280, h: 720 },
    "9:16": { w: 720, h: 1280 },
    "1:1": { w: 720, h: 720 },
    "4:5": { w: 720, h: 900 },
  },
};

const FPS = 30;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => { stdout += d.toString(); });
    child.stderr?.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

async function probeDuration(filePath) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const seconds = parseFloat(stdout.trim());
  return Number.isFinite(seconds) ? seconds : 0;
}

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status} ${res.statusText})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, bytes);
}

function assetPath(workDir, name) {
  return path.join(workDir, `${name}.bin`);
}

// Same fallback-to-solid-frame behavior as render.js's ensureSceneImage — a
// dead image URL must not kill the whole job.
async function ensureSceneImage(imageUrl, destPath, w, h) {
  try {
    await downloadTo(imageUrl, destPath);
    const stat = await fs.stat(destPath);
    if (!stat.size) throw new Error("downloaded file is empty");
  } catch (e) {
    console.error(`[lane1] scene image failed (${imageUrl}): ${e.message} — using a solid dark placeholder frame.`);
    await run("ffmpeg", [
      "-y", "-f", "lavfi", "-i", `color=c=0x0a0a0a:s=${w}x${h}`,
      "-frames:v", "1", "-vcodec", "png", "-f", "image2",
      destPath,
    ]);
  }
}

// Same Ken Burns technique as render.js's buildKenBurnsAndCover.
function buildKenBurnsAndCover(w, h, frames) {
  const perFrame = (0.06 / Math.max(1, frames)).toFixed(6);
  return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},zoompan=z='min(zoom+${perFrame},1.06)':d=${frames}:s=${w}x${h}:fps=${FPS}`;
}

// One scene: still image, cover-fit + Ken Burns zoom, silent (audio for the
// whole short is handled once, after concatenation, in finishAndEncode —
// unlike render.js's per-scene voice, Lane 1 generates a single voiceover
// covering the whole script, not one per scene).
async function buildSceneClip(scene, index, imagePath, workDir, w, h) {
  const clipSeconds = Math.max(0.5, Number(scene.seconds) || 5);
  const frames = Math.max(1, Math.round(clipSeconds * FPS));
  const vf = buildKenBurnsAndCover(w, h, frames);
  const outPath = path.join(workDir, `scene-${index}.mp4`);

  await run("ffmpeg", [
    "-y", "-loop", "1", "-i", imagePath,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-filter_complex", `[0:v]${vf}[v]`,
    "-map", "[v]", "-map", "1:a",
    "-t", String(clipSeconds),
    "-r", String(FPS),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "veryfast",
    "-c:a", "aac",
    outPath,
  ]);
  return outPath;
}

async function concatScenes(clipPaths, workDir) {
  const listPath = path.join(workDir, "concat-list.txt");
  const listContents = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(listPath, listContents);

  const concatPath = path.join(workDir, "concat.mp4");
  await run("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", listPath,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "veryfast",
    "-c:a", "aac",
    concatPath,
  ]);
  return concatPath;
}

// The "produced" feel: a light auto contrast/saturation lift, plus loudnorm
// on whatever audio track survives the audioMode branch below (a no-op-ish
// pass on near-silence when audioMode is "silent", which is harmless).
const FINISHING_VF = "eq=contrast=1.05:saturation=1.12";

// Final assembly: mixes in voiceover/music (or leaves the track silent),
// applies the finishing pass, and re-encodes at the target quality —
// -preset slow -crf 20 -pix_fmt yuv420p, capped toward ~8-10 Mbps via
// -maxrate/-bufsize, +faststart for immediate web playback.
async function finishAndEncode({ concatPath, audioMode, voiceoverPath, musicPath, workDir }) {
  const outPath = path.join(workDir, "out.mp4");
  const encodeArgs = [
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-maxrate", "10M", "-bufsize", "20M",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
  ];

  if (audioMode === "voiceover" && voiceoverPath) {
    const videoDuration = await probeDuration(concatPath);
    await run("ffmpeg", [
      "-y", "-i", concatPath, "-i", voiceoverPath,
      "-filter_complex", `[0:v]${FINISHING_VF}[v];[1:a]apad=whole_dur=${videoDuration},loudnorm[aout]`,
      "-map", "[v]", "-map", "[aout]",
      ...encodeArgs, "-shortest",
      outPath,
    ]);
  } else if (audioMode === "music" && musicPath) {
    await run("ffmpeg", [
      "-y", "-i", concatPath, "-stream_loop", "-1", "-i", musicPath,
      "-filter_complex", `[0:v]${FINISHING_VF}[v];[1:a]volume=0.9,loudnorm[aout]`,
      "-map", "[v]", "-map", "[aout]",
      ...encodeArgs, "-shortest",
      outPath,
    ]);
  } else {
    // Silent (or voiceover/music requested but its download failed —
    // ensured by the caller, see assembleLane1Video) — keep the concat
    // step's existing silent audio track, just apply the video finishing
    // pass and re-encode at final quality.
    await run("ffmpeg", [
      "-y", "-i", concatPath,
      "-vf", FINISHING_VF,
      ...encodeArgs,
      outPath,
    ]);
  }
  return outPath;
}

// Same BASE44_UPLOAD_URL/BASE44_UPLOAD_TOKEN approach as every other
// server-render module's uploadToBase44/uploadResult.
async function uploadToBase44(filePath) {
  const uploadUrl = process.env.BASE44_UPLOAD_URL;
  const uploadToken = process.env.BASE44_UPLOAD_TOKEN;
  if (!uploadUrl) throw new Error("BASE44_UPLOAD_URL is not configured.");

  const fileBuffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: "video/mp4" }), "lane1-video.mp4");

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
 * assembleLane1Video(project, onProgress) — project = { scenes: [{
 * imageUrl, seconds }], ratio ("16:9"|"9:16"|"1:1"|"4:5"), resolution
 * ("1080p"|"720p", default "1080p"), audioMode ("voiceover"|"music"|
 * "silent"), voiceoverUrl, musicUrl }. Downloads scene images, builds a
 * Ken Burns clip per scene (2-4 scenes concatenate into one continuous
 * 16-32s short — no special "stitch" mode needed, concatenation already
 * handles any scene count), mixes in the requested audio, applies a
 * contrast/saturation + loudnorm finishing pass, encodes at
 * -preset slow -crf 20 -pix_fmt yuv420p capped toward ~8-10 Mbps with
 * +faststart, uploads to Base44, and returns the persistent file_url.
 */
export async function assembleLane1Video(project, onProgress = () => {}) {
  const resolutionTier = RESOLUTIONS[project.resolution] ? project.resolution : "1080p";
  const { w, h } = RESOLUTIONS[resolutionTier][project.ratio] || RESOLUTIONS[resolutionTier]["9:16"];
  const audioMode = ["voiceover", "music", "silent"].includes(project.audioMode) ? project.audioMode : "silent";
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "lane1-"));

  try {
    onProgress(0);

    const scenes = Array.isArray(project.scenes) ? project.scenes.filter((s) => s?.imageUrl) : [];
    if (!scenes.length) {
      throw new Error("project.scenes must include at least one scene with an imageUrl");
    }

    // ── Download stage (0 -> 0.1) ──
    const sceneImagePaths = [];
    for (let i = 0; i < scenes.length; i++) {
      const imgPath = assetPath(workDir, `scene-${i}-image`);
      await ensureSceneImage(scenes[i].imageUrl, imgPath, w, h);
      sceneImagePaths.push(imgPath);
    }

    let voiceoverPath = null;
    if (audioMode === "voiceover" && project.voiceoverUrl) {
      voiceoverPath = assetPath(workDir, "voiceover");
      try {
        await downloadTo(project.voiceoverUrl, voiceoverPath);
      } catch (e) {
        console.error(`[lane1] voiceover download failed (${project.voiceoverUrl}): ${e.message} — shipping silent instead.`);
        voiceoverPath = null;
      }
    }

    let musicPath = null;
    if (audioMode === "music" && project.musicUrl) {
      musicPath = assetPath(workDir, "music");
      try {
        await downloadTo(project.musicUrl, musicPath);
      } catch (e) {
        console.error(`[lane1] music download failed (${project.musicUrl}): ${e.message} — shipping silent instead.`);
        musicPath = null;
      }
    }
    onProgress(0.1);

    // ── Per-scene clips (0.1 -> 0.6) ──
    const clipPaths = [];
    for (let i = 0; i < scenes.length; i++) {
      clipPaths.push(await buildSceneClip(scenes[i], i, sceneImagePaths[i], workDir, w, h));
      onProgress(0.1 + ((i + 1) / scenes.length) * 0.5);
    }

    // ── Concat (0.6 -> 0.7) ──
    const concatPath = await concatScenes(clipPaths, workDir);
    onProgress(0.7);

    // ── Finishing pass + final encode (0.7 -> 0.95) ──
    const finalPath = await finishAndEncode({ concatPath, audioMode, voiceoverPath, musicPath, workDir });
    onProgress(0.95);

    // ── Upload (0.95 -> 1.0) ──
    const url = await uploadToBase44(finalPath);
    onProgress(1.0);
    return url;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
