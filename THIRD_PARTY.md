# Third-party components

Fresh FrameFair application code; no previous competition code copied.

- TensorFlow.js 4.22.0: https://github.com/tensorflow/tfjs — Apache-2.0. Runtime union bundle includes CPU backend.
- TensorFlow Models face-detection 1.0.3: https://github.com/tensorflow/tfjs-models/tree/master/face-detection — Apache-2.0. MediaPipeFaceDetector TFJS runtime, full-range pretrained model, up to 30 detections. Model URLs are supplied by this pinned package; initial model download is required. This is inference, not training or a new foundational model.
- MediaPipe face_detection 0.4.1646425229 runtime peer: https://github.com/google-ai-edge/mediapipe — Apache-2.0.
- License texts: https://github.com/tensorflow/tfjs/blob/master/LICENSE and https://github.com/tensorflow/tfjs-models/blob/master/LICENSE and https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE . Preserve applicable notices if redistributing these components rather than loading official CDN packages.

No API account, key, paid service or photo upload is used. CDN requests disclose normal network request metadata to CDN/model hosts; photo bytes are not included. No analytics. CPU performance and detection recall must be measured on the actual browser; loading and failed detection states are not replaced with mock results.

Optional NASA sample: see assets/demo-source.json supplied by the central operator. Credit NASA / James Blair; informational demonstration, no endorsement. A detected-region count is not the total number of people in the photograph.
