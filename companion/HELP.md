# VBS Overlay

Bitfocus Companion module for **VBS Overlay**.

## Supported control areas

- Desk Lock
- Show mode
- Sync actions
- Color slots
- MIDI bridge
- Timecode transport
- Timecode sender / receiver
- LTC level / delay controls
- Timecode preset load / play
- Linked machine monitoring

## Live monitoring

The module can poll the VBS remote status TCP port to expose live Companion variables for:

- local machine performance
- linked machine performance
- network and link state
- timecode text counters and split HH / MM / SS / FF fields

## Configuration

- **Target host / IP**: machine running VBS Overlay
- **Target OSC port**: OSC listen port from VBS Overlay
- **Status host / IP**: optional override for the status endpoint
- **Status TCP port**: VBS remote status port
- **Status poll interval**: polling cadence in milliseconds
- **Status timeout**: TCP timeout in milliseconds

## Notes

- OSC integer arguments are sent as 32-bit integers.
- Some state values are live-polled from VBS status.
- Some button feedbacks still depend on Companion-side shadow state when VBS does not report that state directly.
