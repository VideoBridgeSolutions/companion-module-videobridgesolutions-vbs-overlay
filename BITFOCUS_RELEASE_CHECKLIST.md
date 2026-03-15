# Bitfocus release checklist — VBS Overlay

## What this bundle is

This bundle is the **GitHub source repo starter** aligned with the currently working local module build, including the feedback refresh fix (`checkFeedbacks()` instead of the broken refresh path).

It is **not** the importable Companion package. For Companion import/testing, use the built `.tgz`.

## Final module identity

- GitHub repo: `companion-module-videobridgesolutions-vbs-overlay`
- Companion module id: `videobridgesolutions-vbs-overlay`
- Legacy id kept for migration: `videobridgesolutions-vbs-overlay-osc`

## Repo contents to keep

- `companion/`
- `src/`
- `LICENSE`
- `package.json`
- `README.md`
- `.gitignore`

Do **not** commit:
- `node_modules/`
- `pkg/`
- generated `.tgz` files
- `.DS_Store`

## Before public submission

- Test on a clean Companion 4.2 installation
- Verify live feedbacks: Desk Lock, Show, MIDI, Timecode Sender/Receiver, Sync
- Verify variables update from VBS status polling
- Verify presets import and new buttons react correctly
- Confirm maintainer email and repo URLs are the ones you want public

## Bitfocus-oriented notes

- `companion/manifest.json` uses the official module id
- `manifest.version` is set to `0.0.0` in this source bundle so the build pipeline can stamp the release version
- `runtime.apiVersion` is set to `0.0.0` in this source bundle for the same reason
- `package.json` stays on `1.0.0` so you can tag/build the first public release cleanly

## Local build steps

```bash
yarn install
yarn companion-module-build
```

That should create the packaged `pkg/` output and the `.tgz` release artifact to test in Companion.

## Suggested first release flow

1. Push this repo to GitHub
2. Run `yarn install`
3. Run `yarn companion-module-build`
4. Test the produced `.tgz` in Companion
5. Commit any final fixes
6. Tag `v1.0.0`
7. Create the GitHub release from that tag
8. Submit the version in the Bitfocus Developer Portal

## Slack message draft

Hello,

I would like to publish a new Companion module.

- GitHub username / org: `VideoBridgeSolutions`
- Requested repo name: `companion-module-videobridgesolutions-vbs-overlay`
- Module / product: `VBS Overlay`
- Manufacturer: `Video Bridge Solutions`
- Target Companion line: `4.2+`

The module is ready for review and the GitHub repository is prepared.
