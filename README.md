# VBS Overlay Companion Module

Official Bitfocus Companion module source for **VBS Overlay**.

## Features

- OSC control for VBS Overlay
- Timecode transport, sender, receiver, preset actions
- MIDI bridge actions
- Live variable polling from the VBS remote status TCP endpoint
- Linked machine monitoring variables
- Companion presets and feedbacks for show control and monitoring

## Runtime target

This module currently targets the **Companion 4.2 API line** with `@companion-module/base` **1.14.0** and a `node22` runtime.

## Local development

1. Clone this repository into your Companion developer modules folder.
2. Run `yarn install`
3. Open Companion and enable developer modules.
4. Add the `VBS Overlay` connection.

## Packaging

Use the official builder:

```bash
yarn companion-module-build
```

That should generate the packaged `pkg/` output and a `.tgz` suitable for import/testing.

## Release

- Bump `package.json` version
- Commit and tag as `vX.Y.Z`
- Build and test the package
- Submit the tagged version in the Bitfocus Developer Portal


## Current known-good baseline

This source bundle matches the local module build where live status variables and button feedback refresh are working together correctly.
