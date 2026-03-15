const { combineRgb } = require('@companion-module/base')

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

function targetState(self, target) {
  return !!self.getBooleanTargetState(target)
}

module.exports = function updateFeedbacks(self) {
  self.setFeedbackDefinitions({
    transport_state: {
      type: 'boolean',
      name: 'Transport state matches',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 153, 51),
      },
      options: [
        {
          id: 'state',
          type: 'dropdown',
          label: 'State',
          default: 'playing',
          choices: [
            { id: 'playing', label: 'Playing' },
            { id: 'paused', label: 'Paused' },
            { id: 'stopped', label: 'Stopped' },
          ],
        },
      ],
      callback: (feedback) => self.state.transportState === feedback.options.state,
    },

    boolean_target: {
      type: 'boolean',
      name: 'Boolean target is enabled',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 153, 51),
      },
      options: [
        {
          id: 'target',
          type: 'dropdown',
          label: 'Target',
          default: 'timecode_sender',
          choices: [
            { id: 'timecode_sender', label: 'Timecode sender' },
            { id: 'timecode_receiver', label: 'Timecode receiver' },
            { id: 'midi_sender', label: 'MIDI sender' },
            { id: 'midi_receiver', label: 'MIDI receiver' },
            { id: 'desk_lock', label: 'Desk Lock' },
            { id: 'show_mode', label: 'Show Mode' },
          ],
        },
      ],
      callback: (feedback) => targetState(self, feedback.options.target),
    },

    desk_lock_state: {
      type: 'boolean',
      name: 'Desk Lock is locked',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(220, 20, 20),
      },
      options: [],
      callback: () => targetState(self, 'desk_lock'),
    },

    show_mode_state: {
      type: 'boolean',
      name: 'Show Mode is enabled',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 210, 60),
      },
      options: [],
      callback: () => targetState(self, 'show_mode'),
    },

    midi_sender_state: {
      type: 'boolean',
      name: 'MIDI sender is enabled',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 210, 60),
      },
      options: [],
      callback: () => targetState(self, 'midi_sender'),
    },

    midi_receiver_state: {
      type: 'boolean',
      name: 'MIDI receiver is enabled',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 210, 60),
      },
      options: [],
      callback: () => targetState(self, 'midi_receiver'),
    },

    timecode_sender_state: {
      type: 'boolean',
      name: 'Timecode sender is enabled',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 210, 60),
      },
      options: [],
      callback: () => targetState(self, 'timecode_sender'),
    },

    timecode_receiver_state: {
      type: 'boolean',
      name: 'Timecode receiver is enabled',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 210, 60),
      },
      options: [],
      callback: () => targetState(self, 'timecode_receiver'),
    },

    current_preset: {
      type: 'boolean',
      name: 'Current preset matches',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 100, 180),
      },
      options: [
        {
          id: 'index',
          type: 'dropdown',
          label: 'Preset',
          default: getDynamicTimecodePresetChoices(self)[0]?.id || '1',
          choices: getDynamicTimecodePresetChoices(self),
        },
      ],
      callback: (feedback) => Number(self.state.currentPreset) === Number(feedback.options.index),
    },

    color_slot: {
      type: 'boolean',
      name: 'Machine color slot matches',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(120, 0, 160),
      },
      options: [
        {
          id: 'index',
          type: 'number',
          label: 'Machine / index',
          default: 1,
          min: 1,
          max: 10,
        },
        {
          id: 'slot',
          type: 'number',
          label: 'Color slot',
          default: 0,
          min: 0,
          max: 9,
        },
      ],
      callback: (feedback) => Number(self.state.colors[Number(feedback.options.index) - 1]) === Number(feedback.options.slot),
    },

    linked_machine_online: {
      type: 'boolean',
      name: 'Linked machine online',
      defaultStyle: {
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 120, 40),
      },
      options: [
        {
          id: 'index',
          type: 'number',
          label: 'Linked machine index',
          default: 1,
          min: 1,
          max: 8,
        },
      ],
      callback: (feedback) => !!self.state.linkedMachines?.[Number(feedback.options.index) - 1]?.isOnline,
    },
  })
}
