"use client";

export type FramePosition = "start" | "middle" | "end";

/**
 * Capture a frame from a <video> element at the given position.
 * Returns a data URL (JPEG).
 *
 * CORS note: if the video host doesn't allow cross-origin canvas reads,
 * canvas.toDataURL() throws. The caller should catch and fall back to
 * using the raw video URL instead of a captured frame.
 */
export async function captureVideoFrame(
  video: HTMLVideoElement,
  position: FramePosition
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!video.duration || isNaN(video.duration)) {
      reject(new Error("Video has no duration"));
      return;
    }

    const targetTime =
      position === "start"
        ? 0
        : position === "end"
        ? Math.max(0, video.duration - 0.1)
        : video.duration / 2;

    const doCapture = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("No canvas context")); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        // If canvas is tainted (CORS), toDataURL throws or returns an empty image
        if (dataUrl === "data:,") { reject(new Error("Tainted canvas")); return; }
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    if (Math.abs(video.currentTime - targetTime) < 0.05) {
      doCapture();
    } else {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        doCapture();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = targetTime;
    }
  });
}
