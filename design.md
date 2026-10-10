# FrameFair — implementation design

Fresh static deliverable, created 2026-10-10. No existing project code reused.

Full-window white/slate editorial workspace: black 32/16/13 px typography, teal #087f73 accents, generous spacing, fine rules. Header: FrameFair / Load photo. Intro explains the concrete group-photo crop problem. Toolbar: 1:1, 4:5, 9:16 and face margin. Equal-width center-crop and protected-result canvases make trade-offs visible. Below, the original image is an inspection canvas with actual detected rectangles, a selectable region list, manual draw mode and numeric keyboard-accessible rectangle entry/removal.

Flow: local image → explicit real model detection or manual-only path → inspect/add/remove regions → confirm review → export PNG. Each image, detection result, box, margin or ratio change invalidates review. Model errors remain visible; no fabricated detections. Export disabled until review, at least one region, and no inference in flight. Source photos remain in browser memory; only pinned public runtime/model resources are requested. No telemetry, facial identity, recognition, medical claims, or cloud image API.

Geometry: coordinates are original image pixels. Clamp finite positive boxes to image. Expand each by chosen proportional margin, clamp to image. If their union fits a crop of desired aspect ratio wholly inside the image, choose the largest such crop and shift its center only enough to contain the union. Otherwise contain the entire source in the output with solid padding. Compare retained reviewed regions against a normal center crop. 'Protected' describes selected regions only, never every real face.

Output: 1080 px width and aspect-correct height (1080, 1350, 1920), opaque slate/white padding, PNG. Display original pixel dimensions and actual inference time. Initial model fetch loading/error and image errors are explicit. CPU TFJS backend, MediaPipeFaceDetector full model, maxFaces 30; model can miss small, occluded or side-facing faces. No per-face confidence invented.

NASA demo assets/demo.jpg is optional; button remains disabled unless the local asset loads. Parent supplies verified source/license attribution. Real model inference and browser UI validation are performed by parent. Geometry tested independently with Node built-in tests, including impossible crop, outside/invalid boxes, extreme ratios and non-square images.
