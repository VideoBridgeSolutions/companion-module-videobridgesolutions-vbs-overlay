# Bitfocus release checklist — VBS Overlay

## Final module name

- GitHub repo: `companion-module-videobridgesolutions-vbs-overlay`
- Companion module id: `videobridgesolutions-vbs-overlay`
- Legacy id kept for migration: `videobridgesolutions-vbs-overlay-osc`

## Before asking Bitfocus for the repo

- Create or confirm the GitHub org/repo owner: `VideoBridgeSolutions`
- Decide who will maintain the repo publicly
- Make sure `support@videobridgesolutions.com` is the support mailbox you want exposed

## What Bitfocus expects

- Repo name in `manufacturer-product` format. citeturn946237search0turn946237search1
- `manifest.json` id must match the repo name without the `companion-module-` prefix. citeturn946237search1
- `manifest.json` should leave `version` and `runtime.apiVersion` as `0.0.0` for the build process to fill. citeturn946237search1
- Official packaging should be produced with `yarn companion-module-build`. citeturn946237search1
- First official repo/release request goes through the Bitfocus Slack `#module-development` channel. citeturn946237search0

## Slack message to send

Hello,

I would like to publish a new Companion module.

- GitHub username / org: `VideoBridgeSolutions`
- Requested repo name: `companion-module-videobridgesolutions-vbs-overlay`
- Module / product: `VBS Overlay`
- Manufacturer: `Video Bridge Solutions`
- Target Companion line: `4.2+`

The module is ready for review and I have a GitHub repository prepared.

## GitHub repo contents to push

- `package.json`
- `companion/manifest.json`
- `companion/HELP.md`
- `src/*`
- `README.md`
- `LICENSE`

## Release process

1. Push the repo publicly to GitHub.
2. Run `yarn install`.
3. Run `yarn companion-module-build`.
4. Test the built `.tgz` in Companion locally. citeturn946237search2turn946237search6
5. Bump `package.json` version.
6. Create a git tag in the form `vX.Y.Z`.
7. Create the GitHub release from that tag.
8. Open the Bitfocus Developer Portal and submit that version for review. citeturn946237search0turn946237search1

## Things to fix before public submission

- Validate the module on a clean Companion 4.2 install.
- Decide whether the runtime should remain `node22` or be relaxed to `node18` for wider compatibility.
- Replace any placeholder maintainer info if needed.
- Confirm that all presets and feedbacks load without dev-only hacks.
- Confirm that imported configs migrate cleanly from legacy id `videobridgesolutions-vbs-overlay-osc`.
