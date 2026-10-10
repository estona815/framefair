# FrameFair

Turn a group photo into a square or vertical image while protecting the rectangles you review. FrameFair compares a normal center crop with a constrained crop; if the selected regions cannot fit, it adds solid padding. The AI proposes face boxes. You inspect, correct, and approve them before exporting.

## Run

Static browser application. Start from this directory with `python3 -m http.server 8765 --bind 127.0.0.1`, then open http://127.0.0.1:8765 . No install/build step. The first Find faces action fetches pinned open-source runtime packages and pretrained model files. Application code processes photos in browser memory and implements no photo upload endpoint or analytics. Third-party runtime code is fetched from public CDNs; a network traffic audit has not yet been performed.

Choose the NASA sample or a local JPEG/PNG/WebP, run Find faces, select a ratio, inspect the original, and add any missed rectangles. Draw with a pointer or enter original-image pixel coordinates; each region also has a keyboard-accessible Remove button. Confirm review to enable Export PNG. Changing the photo, ratio, margin, or region selection resets review.

## Verified example — 2026-10-10

The actual browser test used the bundled, credited NASA / James Blair photograph (1041 × 694). The model returned **3 detections**, missing one of the four front-facing subjects. A reviewer added the missing region at x=784, y=273, width=64, height=76. This is an observed failure and correction, not a claim of complete face detection.

- Actual CPU inference: **8,203 ms** in this test; not a general performance benchmark.
- At 9:16, the normal center crop retained **2 of the 4 selected regions**. The protected result used solid padding.
- A physical **1080 × 1920 PNG** was exported and checked. SHA-256: `6fce12f2ec07de2caeff46eeac58320c51b0cd87c6f7f1d50d848a2d58609547`.
- Changing ratio after review unchecked the review control and disabled export.
- Mobile check: requested 390 × 844 viewport; observed client width and scroll width were both 375 px, with no horizontal overflow.

These results are one manually reviewed example, not detection accuracy measured over a dataset. 'Protected' means the selected rectangles, not everyone in the photograph. The sample also contains audience members outside the four front-facing subjects.

## Validation and limits

Run `node --test geometry.test.mjs` and `node --check app.mjs`. All 6 geometry tests passed: feasible off-center containment, impossible narrow crop, invalid/outside rectangles, non-square and extreme ratios, empty-region behavior, and a deterministic edge-margin grid. HTTP checks passed for the app modules and sample image.

The pretrained full-range MediaPipe face detector runs through TensorFlow.js on CPU with a configured cap of 30 detections. It can miss small, occluded, or side-facing faces and can produce incorrect boxes. No identity, demographic attribute, or medical state is inferred. No confidence percentage is invented. The runtime/model must download on first use, so this is not a guaranteed offline-first installation. A download that stalls can leave detection loading until the browser fails the request; reload and manual region entry remain available. Repeated failure handling and unavailable-model manual recovery have not been browser-tested. Keyboard controls exist in code but a complete keyboard-only accessibility audit is still pending.

The initial file limit is 20 MB; decoded photos above 40 megapixels are rejected. The pixel limit is checked after decoding, so very large compressed inputs may briefly consume additional browser memory. Outputs are fixed at 1080 pixels wide. Cropping does not remove sensitive information intentionally, and this is not a privacy-redaction tool.

## Source and licenses

All application code was freshly authored on 2026-10-10; `design.md` predates implementation. No previous competition project code was copied. The same implementation author performed a code self-review; another operator performed the browser QA described above. Unit tests do not claim to validate model accuracy.

See [THIRD_PARTY.md](THIRD_PARTY.md) for pinned dependencies and license links, and [assets/demo-source.json](assets/demo-source.json) for the NASA source, credit, hash, and media-use guidance. The sample is an informational demonstration and implies no NASA or depicted-person endorsement. Dependency licenses do not automatically license this application's original code or grant commercial endorsement rights for the photo.

No account, registration, publication, submission, database mutation, or external messaging is performed by the application.
