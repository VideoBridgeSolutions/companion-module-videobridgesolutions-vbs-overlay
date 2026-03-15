const { OSC_PATHS, BOOLEAN_TARGETS } = require('./constants')

function stateChoices() {
  return [
    { id: 1, label: 'On / Enable / Lock' },
    { id: 0, label: 'Off / Disable / Unlock' },
  ]
}


function clampNumber(value, min, max, fallback = 0) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

function readNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function parseIntegerList(raw) {
  const text = String(raw || '').trim()
  if (!text) return []

  return text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isFinite(value))
}

function getDynamicTimecodePresetChoices(self) {
  const presets = Array.isArray(self.state?.remoteTimecode?.presets) ? self.state.remoteTimecode.presets : []
  if (presets.length > 0) {
    return presets.map((preset) => ({
      id: String(preset.index),
      label: `${String(preset.index).padStart(2, '0')} - ${preset.name || `Preset ${preset.index}`}${preset.timecode ? ` (${preset.timecode})` : ''}`,
    }))
  }

  const fallback = []
  for (let i = 1; i <= 8; i++) {
    fallback.push({ id: String(i), label: `Preset ${i}` })
  }
  return fallback
}

module.exports = function updateActions(self) {
  const dynamicPresetChoices = getDynamicTimecodePresetChoices(self)
  const dynamicPresetDefault = dynamicPresetChoices[0]?.id || '1'

  self.setActionDefinitions({
    alive_ping: {
      name: 'Alive ping (/vbs/alive 1)',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.alive, [1], { lastSyncMode: '' })
      },
    },

    desk_lock_set: {
      name: 'Desk Lock set',
      options: [{ id: 'state', type: 'dropdown', label: 'State', default: 1, choices: stateChoices() }],
      callback: async function (event) {
        const value = Number(event.options.state)
        await self.sendAndTrack(OSC_PATHS.deskLock, [value], { deskLock: value === 1 })
      },
    },

    show_mode_set: {
      name: 'Show Mode set',
      options: [{ id: 'state', type: 'dropdown', label: 'State', default: 1, choices: stateChoices() }],
      callback: async function (event) {
        const value = Number(event.options.state)
        await self.sendAndTrack(OSC_PATHS.showMode, [value], { showMode: value === 1 })
      },
    },

    sync_run: {
      name: 'Run sync',
      options: [
        {
          id: 'mode',
          type: 'dropdown',
          label: 'Mode',
          default: 'repository',
          choices: [
            { id: 'repository', label: 'Repository sync' },
            { id: 'project', label: 'Project/composition sync' },
            { id: 'project_relaunch', label: 'Project/composition sync + relaunch' },
          ],
        },
      ],
      callback: async function (event) {
        switch (event.options.mode) {
          case 'repository':
            await self.sendAndTrack(OSC_PATHS.syncRepository, [1], { lastSyncMode: 'repository' })
            break
          case 'project_relaunch':
            await self.sendAndTrack(OSC_PATHS.syncProject, [2], { lastSyncMode: 'project_relaunch' })
            break
          case 'project':
          default:
            await self.sendAndTrack(OSC_PATHS.syncProject, [1], { lastSyncMode: 'project' })
            break
        }
      },
    },

    color_set: {
      name: 'Set machine color slot',
      options: [
        { id: 'index', type: 'number', label: 'Machine / index', default: 1, min: 1, max: 10 },
        { id: 'slot', type: 'number', label: 'Color slot', default: 0, min: 0, max: 9 },
      ],
      callback: async function (event) {
        const index = Number(event.options.index)
        const slot = Number(event.options.slot)
        const colors = [].concat(self.state.colors)
        colors[index - 1] = slot
        await self.sendAndTrack(OSC_PATHS.color, [index, slot], { colors })
      },
    },

    midi_sender_set: {
      name: 'MIDI sender set',
      options: [{ id: 'state', type: 'dropdown', label: 'State', default: 1, choices: stateChoices() }],
      callback: async function (event) {
        const value = Number(event.options.state)
        await self.sendAndTrack(OSC_PATHS.midiSender, [value], { midiSender: value === 1 })
      },
    },

    midi_sender_start: {
      name: 'MIDI sender start',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.midiSenderStart, [1], { midiSender: true })
      },
    },

    midi_sender_stop: {
      name: 'MIDI sender stop',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.midiSenderStop, [1], { midiSender: false })
      },
    },

    midi_receiver_set: {
      name: 'MIDI receiver set',
      options: [{ id: 'state', type: 'dropdown', label: 'State', default: 1, choices: stateChoices() }],
      callback: async function (event) {
        const value = Number(event.options.state)
        await self.sendAndTrack(OSC_PATHS.midiReceiver, [value], { midiReceiver: value === 1 })
      },
    },

    midi_receiver_refresh: {
      name: 'MIDI receiver refresh',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.midiReceiverRefresh, [1], {})
      },
    },

    timecode_transport: {
      name: 'Timecode transport',
      options: [
        {
          id: 'command',
          type: 'dropdown',
          label: 'Command',
          default: 'play',
          choices: [
            { id: 'play', label: 'Play' },
            { id: 'pause', label: 'Pause' },
            { id: 'stop', label: 'Stop' },
            { id: 'reset', label: 'Reset' },
          ],
        },
      ],
      callback: async function (event) {
        switch (event.options.command) {
          case 'pause':
            await self.sendAndTrack(OSC_PATHS.timecodePause, [1], { transportState: 'paused' })
            break
          case 'stop':
            await self.sendAndTrack(OSC_PATHS.timecodeStop, [1], { transportState: 'stopped' })
            break
          case 'reset':
            await self.sendAndTrack(OSC_PATHS.timecodeReset, [1], {})
            break
          case 'play':
          default:
            await self.sendAndTrack(OSC_PATHS.timecodePlay, [1], { transportState: 'playing' })
            break
        }
      },
    },

    timecode_sender_set: {
      name: 'Timecode sender set',
      options: [{ id: 'state', type: 'dropdown', label: 'State', default: 1, choices: stateChoices() }],
      callback: async function (event) {
        const value = Number(event.options.state)
        await self.sendAndTrack(OSC_PATHS.timecodeSender, [value], { timecodeSender: value === 1 })
      },
    },

    timecode_receiver_set: {
      name: 'Timecode receiver set',
      options: [{ id: 'state', type: 'dropdown', label: 'State', default: 1, choices: stateChoices() }],
      callback: async function (event) {
        const value = Number(event.options.state)
        await self.sendAndTrack(OSC_PATHS.timecodeReceiver, [value], { timecodeReceiver: value === 1 })
      },
    },

    ltc_level_set: {
      name: 'Set LTC level',
      options: [{ id: 'value', type: 'number', label: 'Level (dB)', default: 0, min: -30, max: 12 }],
      callback: async function (event) {
        const value = clampNumber(event.options.value, -30, 12, 0)
        await self.sendAndTrack(OSC_PATHS.timecodeLtcLevel, [value], { ltcLevelDb: value })
      },
    },

    ltc_level_adjust: {
      name: 'Adjust LTC level',
      options: [{ id: 'delta', type: 'number', label: 'Delta (dB)', default: 1, min: -12, max: 12 }],
      callback: async function (event) {
        const delta = clampNumber(event.options.delta, -12, 12, 1)
        const current = readNumber(self.state.ltcLevelDb, 0)
        const value = clampNumber(current + delta, -30, 12, 0)
        await self.sendAndTrack(OSC_PATHS.timecodeLtcLevel, [value], { ltcLevelDb: value })
      },
    },

    ltc_level_reset: {
      name: 'Reset LTC level',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.timecodeLtcLevelReset, [1], { ltcLevelDb: 0 })
      },
    },

    external_delay_set: {
      name: 'Set external delay',
      options: [{ id: 'value', type: 'number', label: 'Delay (frames)', default: 0, min: -30, max: 30 }],
      callback: async function (event) {
        const value = clampNumber(event.options.value, -30, 30, 0)
        await self.sendAndTrack(OSC_PATHS.timecodeExternalDelay, [value], { externalDelayFrames: value })
      },
    },

    external_delay_adjust: {
      name: 'Adjust external delay',
      options: [{ id: 'delta', type: 'number', label: 'Delta (frames)', default: 1, min: -30, max: 30 }],
      callback: async function (event) {
        const delta = clampNumber(event.options.delta, -30, 30, 1)
        const current = readNumber(self.state.externalDelayFrames, 0)
        const value = clampNumber(current + delta, -30, 30, 0)
        await self.sendAndTrack(OSC_PATHS.timecodeExternalDelay, [value], { externalDelayFrames: value })
      },
    },

    external_delay_reset: {
      name: 'Reset external delay',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.timecodeExternalDelayReset, [1], { externalDelayFrames: 0 })
      },
    },

    generator_delay_set: {
      name: 'Set generator delay',
      options: [{ id: 'value', type: 'number', label: 'Delay (frames)', default: 0, min: -30, max: 30 }],
      callback: async function (event) {
        const value = clampNumber(event.options.value, -30, 30, 0)
        await self.sendAndTrack(OSC_PATHS.timecodeGeneratorDelay, [value], { generatorDelayFrames: value })
      },
    },

    generator_delay_adjust: {
      name: 'Adjust generator delay',
      options: [{ id: 'delta', type: 'number', label: 'Delta (frames)', default: 1, min: -30, max: 30 }],
      callback: async function (event) {
        const delta = clampNumber(event.options.delta, -30, 30, 1)
        const current = readNumber(self.state.generatorDelayFrames, 0)
        const value = clampNumber(current + delta, -30, 30, 0)
        await self.sendAndTrack(OSC_PATHS.timecodeGeneratorDelay, [value], { generatorDelayFrames: value })
      },
    },

    generator_delay_reset: {
      name: 'Reset generator delay',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.timecodeGeneratorDelayReset, [1], { generatorDelayFrames: 0 })
      },
    },

    timecode_preset_preroll_set: {
      name: 'Set timecode preset master preroll',
      options: [{ id: 'value', type: 'number', label: 'Master preroll (seconds)', default: 0, min: 0, max: 3600 }],
      callback: async function (event) {
        const value = clampNumber(event.options.value, 0, 3600, 0)
        await self.sendAndTrack(OSC_PATHS.timecodePresetMasterPreroll, [value], {})
        self.state.remoteTimecode.presetMasterPrerollSeconds = value
        self.pushAllVariableValues()
      },
    },

    timecode_preset_preroll_adjust: {
      name: 'Adjust timecode preset master preroll',
      options: [{ id: 'delta', type: 'number', label: 'Delta (seconds)', default: 1, min: -600, max: 600 }],
      callback: async function (event) {
        const delta = clampNumber(event.options.delta, -600, 600, 1)
        const current = readNumber(self.state.remoteTimecode?.presetMasterPrerollSeconds, 0)
        const value = clampNumber(current + delta, 0, 3600, 0)
        await self.sendAndTrack(OSC_PATHS.timecodePresetMasterPreroll, [value], {})
        self.state.remoteTimecode.presetMasterPrerollSeconds = value
        self.pushAllVariableValues()
      },
    },

    timecode_preset_preroll_reset: {
      name: 'Reset timecode preset master preroll',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.timecodePresetMasterPreroll, [0], {})
        self.state.remoteTimecode.presetMasterPrerollSeconds = 0
        self.pushAllVariableValues()
      },
    },

    timecode_refresh: {
      name: 'Timecode refresh',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.timecodeRefresh, [1], {})
      },
    },

    timecode_restart_rx: {
      name: 'Timecode restart RX',
      options: [],
      callback: async function () {
        await self.sendAndTrack(OSC_PATHS.timecodeRestartRx, [1], {})
      },
    },

    timecode_preset_load: {
      name: 'Timecode preset load',
      options: [
        {
          id: 'index',
          type: 'dropdown',
          label: 'Preset',
          default: dynamicPresetDefault,
          choices: dynamicPresetChoices,
        },
      ],
      callback: async function (event) {
        const index = Number(event.options.index)
        await self.sendAndTrack(OSC_PATHS.timecodePresetLoad, [index], { currentPreset: index })
      },
    },

    timecode_preset_play: {
      name: 'Timecode preset play',
      options: [
        {
          id: 'index',
          type: 'dropdown',
          label: 'Preset',
          default: dynamicPresetDefault,
          choices: dynamicPresetChoices,
        },
      ],
      callback: async function (event) {
        const index = Number(event.options.index)
        await self.sendAndTrack(OSC_PATHS.timecodePresetPlay, [index], {
          currentPreset: index,
          transportState: 'playing',
        })
      },
    },

    timecode_preset_load_manual: {
      name: 'Timecode preset load (manual index)',
      options: [{ id: 'index', type: 'number', label: 'Preset index', default: 1, min: 1, max: 999 }],
      callback: async function (event) {
        const index = Number(event.options.index)
        await self.sendAndTrack(OSC_PATHS.timecodePresetLoad, [index], { currentPreset: index })
      },
    },

    timecode_preset_play_manual: {
      name: 'Timecode preset play (manual index)',
      options: [{ id: 'index', type: 'number', label: 'Preset index', default: 1, min: 1, max: 999 }],
      callback: async function (event) {
        const index = Number(event.options.index)
        await self.sendAndTrack(OSC_PATHS.timecodePresetPlay, [index], {
          currentPreset: index,
          transportState: 'playing',
        })
      },
    },

    toggle_boolean_target: {
      name: 'Toggle boolean target',
      options: [
        {
          id: 'target',
          type: 'dropdown',
          label: 'Target',
          default: BOOLEAN_TARGETS.timecode_sender,
          choices: [
            { id: BOOLEAN_TARGETS.timecode_sender, label: 'Timecode sender' },
            { id: BOOLEAN_TARGETS.timecode_receiver, label: 'Timecode receiver' },
            { id: BOOLEAN_TARGETS.midi_sender, label: 'MIDI sender' },
            { id: BOOLEAN_TARGETS.midi_receiver, label: 'MIDI receiver' },
            { id: BOOLEAN_TARGETS.desk_lock, label: 'Desk Lock' },
            { id: BOOLEAN_TARGETS.show_mode, label: 'Show Mode' },
          ],
        },
      ],
      callback: async function (event) {
        const target = event.options.target
        const current = !!self.getBooleanTargetState(target)
        const nextValue = current ? 0 : 1

        switch (target) {
          case BOOLEAN_TARGETS.timecode_sender:
            await self.sendAndTrack(OSC_PATHS.timecodeSender, [nextValue], { timecodeSender: !current })
            break
          case BOOLEAN_TARGETS.timecode_receiver:
            await self.sendAndTrack(OSC_PATHS.timecodeReceiver, [nextValue], { timecodeReceiver: !current })
            break
          case BOOLEAN_TARGETS.midi_sender:
            await self.sendAndTrack(OSC_PATHS.midiSender, [nextValue], { midiSender: !current })
            break
          case BOOLEAN_TARGETS.midi_receiver:
            await self.sendAndTrack(OSC_PATHS.midiReceiver, [nextValue], { midiReceiver: !current })
            break
          case BOOLEAN_TARGETS.desk_lock:
            await self.sendAndTrack(OSC_PATHS.deskLock, [nextValue], { deskLock: !current })
            break
          case BOOLEAN_TARGETS.show_mode:
            await self.sendAndTrack(OSC_PATHS.showMode, [nextValue], { showMode: !current })
            break
        }
      },
    },

    osc_custom_int: {
      name: 'Custom OSC integer command',
      options: [
        { id: 'path', type: 'textinput', label: 'OSC path', default: '/vbs/alive' },
        { id: 'ints', type: 'textinput', label: 'Int arguments (comma separated)', default: '1' },
      ],
      callback: async function (event) {
        const path = String(event.options.path || '').trim()
        if (!path) return
        const args = parseIntegerList(event.options.ints).map((value) => Number(value))
        const patch = self.getPatchForKnownCustomCommand(path, args)
        await self.sendAndTrack(path, args, patch)
      },
    },
  })
}
