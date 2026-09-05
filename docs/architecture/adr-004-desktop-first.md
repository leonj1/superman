# ADR-004: Version 1 is desktop-first

- Status: Accepted
- Date: 2026-09-05
- Context: Native-resolution photogrammetry and pointer-lock flight have demanding GPU and input requirements.
- Decision: Support current desktop Chrome and Edge with WebGL2, keyboard, mouse, and at least two logical CPU cores.
- Consequences: Unsupported devices receive an explicit screen. Touch and mobile remain separately scoped experiments.
