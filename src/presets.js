const { combineRgb } = require('@companion-module/base')

const COLORS = {
  white: combineRgb(255, 255, 255),
  black: combineRgb(0, 0, 0),
  dark: combineRgb(12, 12, 12),
  darkBlue: combineRgb(5, 24, 90),
  blue: combineRgb(0, 70, 220),
  green: combineRgb(0, 210, 60),
  greenDark: combineRgb(0, 120, 40),
  yellow: combineRgb(255, 215, 0),
  amber: combineRgb(255, 160, 0),
  red: combineRgb(220, 20, 20),
  redDark: combineRgb(130, 0, 0),
  cyan: combineRgb(0, 180, 220),
  purple: combineRgb(110, 20, 170),
  grey: combineRgb(85, 85, 85),
}

function button(category, name, text, actionId, options, feedbacks, styleOverrides) {
  return {
    type: 'button',
    category,
    name,
    style: Object.assign(
      {
        text,
        size: '18',
        color: COLORS.white,
        bgcolor: COLORS.dark,
      },
      styleOverrides || {}
    ),
    steps: [
      {
        down: actionId
          ? [
              {
                actionId,
                options: options || {},
              },
            ]
          : [],
        up: [],
      },
    ],
    feedbacks: feedbacks || [],
  }
}

function togglePreset(category, name, text, target, activeBg, inactiveBg) {
  const dedicatedFeedbackMap = {
    desk_lock: 'desk_lock_state',
    show_mode: 'show_mode_state',
    midi_sender: 'midi_sender_state',
    midi_receiver: 'midi_receiver_state',
    timecode_sender: 'timecode_sender_state',
    timecode_receiver: 'timecode_receiver_state',
  }
  const feedbackId = dedicatedFeedbackMap[target] || 'boolean_target'
  const feedback = {
    feedbackId,
    style: {
      color: COLORS.white,
      bgcolor: activeBg,
    },
  }
  if (feedbackId === 'boolean_target') {
    feedback.options = { target }
  }

  return button(
    category,
    name,
    text,
    'toggle_boolean_target',
    { target },
    [feedback],
    {
      bgcolor: inactiveBg || COLORS.dark,
      color: COLORS.white,
    }
  )
}

function presetDisplay(category, name, text, bg) {
  return button(category, name, text, null, {}, [], { bgcolor: bg || COLORS.dark, color: COLORS.white, size: '14' })
}

function rotaryButton(category, name, text, resetActionId, resetOptions, rotateLeftAction, rotateRightAction, styleOverrides) {
  return {
    type: 'button',
    category,
    name,
    style: Object.assign(
      {
        text,
        size: '14',
        color: COLORS.white,
        bgcolor: COLORS.grey,
      },
      styleOverrides || {}
    ),
    options: { rotaryActions: true },
    steps: [
      {
        down: resetActionId ? [{ actionId: resetActionId, options: resetOptions || {} }] : [],
        up: [],
        rotate_left: rotateLeftAction ? [rotateLeftAction] : [],
        rotate_right: rotateRightAction ? [rotateRightAction] : [],
      },
    ],
    feedbacks: [],
  }
}

function getDynamicPresets(self) {
  const remotePresets = Array.isArray(self.state?.remoteTimecode?.presets) ? self.state.remoteTimecode.presets : []
  if (remotePresets.length > 0) return remotePresets

  const fallback = []
  for (let i = 1; i <= 8; i++) {
    fallback.push({ index: i, name: `Preset ${i}`, timecode: '' })
  }
  return fallback
}

function shortenLine(text, maxLen) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  return raw.length > maxLen ? raw.slice(0, Math.max(0, maxLen - 1)) + '…' : raw
}

function formatPresetText(prefix, preset) {
  const name = String(preset?.name || `Preset ${preset?.index || ''}`).trim()
  const line1 = `${prefix} ${String(preset?.index || '').padStart(2, '0')}`.trim()
  const line2 = shortenLine(name, 11)
  const line3 = preset?.timecode ? shortenLine(String(preset.timecode), 11) : ''
  return [line1, line2, line3].filter(Boolean).join('\n')
}

module.exports = function updatePresets(self) {
  const presets = {}

  presets.tc_go = button(
    'Timecode transport',
    'Timecode Go / Play',
    '▶\nGO',
    'timecode_transport',
    { command: 'play' },
    [{ feedbackId: 'transport_state', options: { state: 'playing' }, style: { color: COLORS.black, bgcolor: COLORS.green } }],
    { bgcolor: COLORS.greenDark, color: COLORS.white, size: '20' }
  )

  presets.tc_pause = button(
    'Timecode transport',
    'Timecode Pause',
    '❚❚\nPAUSE',
    'timecode_transport',
    { command: 'pause' },
    [{ feedbackId: 'transport_state', options: { state: 'paused' }, style: { color: COLORS.black, bgcolor: COLORS.yellow } }],
    { bgcolor: COLORS.amber, color: COLORS.black, size: '18' }
  )

  presets.tc_stop = button(
    'Timecode transport',
    'Timecode Stop',
    '■\nSTOP',
    'timecode_transport',
    { command: 'stop' },
    [{ feedbackId: 'transport_state', options: { state: 'stopped' }, style: { color: COLORS.white, bgcolor: COLORS.red } }],
    { bgcolor: COLORS.redDark, color: COLORS.white, size: '20' }
  )

  presets.tc_reset = button('Timecode transport', 'Timecode Reset', '↺\nRESET', 'timecode_transport', { command: 'reset' }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
    size: '18',
  })

  presets.tc_refresh = button('Timecode transport', 'Timecode Refresh', '⟳\nREFRESH', 'timecode_refresh', {}, [], {
    bgcolor: COLORS.cyan,
    color: COLORS.black,
    size: '16',
  })

  presets.tc_restart_rx = button('Timecode transport', 'Timecode Restart RX', 'RX\nRESTART', 'timecode_restart_rx', {}, [], {
    bgcolor: COLORS.purple,
    color: COLORS.white,
    size: '15',
  })

  presets.tc_sender_toggle = togglePreset('Timecode routing', 'Timecode Sender Toggle', 'TC\nSENDER', 'timecode_sender', COLORS.green, COLORS.dark)
  presets.tc_receiver_toggle = togglePreset('Timecode routing', 'Timecode Receiver Toggle', 'TC\nRECEIVER', 'timecode_receiver', COLORS.green, COLORS.dark)
  presets.midi_sender_toggle = togglePreset('MIDI bridge', 'MIDI Sender Toggle', 'MIDI\nSENDER', 'midi_sender', COLORS.green, COLORS.dark)
  presets.midi_sender_start = button('MIDI bridge', 'MIDI Sender Start', 'MIDI\nSTART', 'midi_sender_start', {}, [], {
    bgcolor: COLORS.blue,
    color: COLORS.white,
  })
  presets.midi_sender_stop = button('MIDI bridge', 'MIDI Sender Stop', 'MIDI\nSTOP', 'midi_sender_stop', {}, [], {
    bgcolor: COLORS.redDark,
    color: COLORS.white,
  })
  presets.midi_receiver_toggle = togglePreset('MIDI bridge', 'MIDI Receiver Toggle', 'MIDI\nRECEIVER', 'midi_receiver', COLORS.green, COLORS.dark)
  presets.midi_receiver_refresh = button('MIDI bridge', 'MIDI Receiver Refresh', 'MIDI\nREFRESH', 'midi_receiver_refresh', {}, [], {
    bgcolor: COLORS.cyan,
    color: COLORS.black,
  })

  presets.desk_lock_toggle = togglePreset('VBS general', 'Desk Lock Toggle', 'DESK\nLOCK', 'desk_lock', COLORS.red, COLORS.dark)
  presets.show_mode_toggle = togglePreset('VBS general', 'Show Mode Toggle', 'SHOW\nMODE', 'show_mode', COLORS.green, COLORS.darkBlue)
  presets.sync_repository = button('VBS general', 'Sync Repository', 'SYNC\nREPO', 'sync_run', { mode: 'repository' }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
  })
  presets.sync_project = button('VBS general', 'Sync Project', 'SYNC\nPROJ', 'sync_run', { mode: 'project' }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
  })
  presets.sync_project_relaunch = button('VBS general', 'Sync Project + Relaunch', 'SYNC\nREL', 'sync_run', { mode: 'project_relaunch' }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
  })

  const labelPrefix = 'VBS_OSC'

  presets.tc_ltc_reset = rotaryButton(
    'Timecode settings',
    'LTC level rotary (press reset, rotate adjust)',
    `LTC\n$(${labelPrefix}:ltc_level_db) dB`,
    'ltc_level_reset',
    {},
    { actionId: 'ltc_level_adjust', options: { delta: -1 } },
    { actionId: 'ltc_level_adjust', options: { delta: 1 } },
    { bgcolor: COLORS.grey, color: COLORS.white, size: '12' }
  )
  presets.tc_ext_reset = rotaryButton(
    'Timecode settings',
    'External delay rotary (press reset, rotate adjust)',
    `EXT\n$(${labelPrefix}:external_delay_frames) fr`,
    'external_delay_reset',
    {},
    { actionId: 'external_delay_adjust', options: { delta: -1 } },
    { actionId: 'external_delay_adjust', options: { delta: 1 } },
    { bgcolor: COLORS.grey, color: COLORS.white, size: '12' }
  )
  presets.tc_gen_reset = rotaryButton(
    'Timecode settings',
    'Generator delay rotary (press reset, rotate adjust)',
    `GEN\n$(${labelPrefix}:generator_delay_frames) fr`,
    'generator_delay_reset',
    {},
    { actionId: 'generator_delay_adjust', options: { delta: -1 } },
    { actionId: 'generator_delay_adjust', options: { delta: 1 } },
    { bgcolor: COLORS.grey, color: COLORS.white, size: '12' }
  )
  presets.tc_preroll_rotary = rotaryButton(
    'Timecode settings',
    'Preset master preroll rotary (press reset, rotate adjust)',
    `PRE\n$(${labelPrefix}:tc_preset_master_preroll_s)s`,
    'timecode_preset_preroll_reset',
    {},
    { actionId: 'timecode_preset_preroll_adjust', options: { delta: -1 } },
    { actionId: 'timecode_preset_preroll_adjust', options: { delta: 1 } },
    { bgcolor: COLORS.darkBlue, color: COLORS.white, size: '12' }
  )
  presets.tc_preroll_minus_10 = button('Timecode settings', 'Preset master preroll -10s', 'PRE\n-10s', 'timecode_preset_preroll_adjust', { delta: -10 }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
    size: '12',
  })
  presets.tc_preroll_minus_1 = button('Timecode settings', 'Preset master preroll -1s', 'PRE\n-1s', 'timecode_preset_preroll_adjust', { delta: -1 }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
    size: '12',
  })
  presets.tc_preroll_plus_1 = button('Timecode settings', 'Preset master preroll +1s', 'PRE\n+1s', 'timecode_preset_preroll_adjust', { delta: 1 }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
    size: '12',
  })
  presets.tc_preroll_plus_10 = button('Timecode settings', 'Preset master preroll +10s', 'PRE\n+10s', 'timecode_preset_preroll_adjust', { delta: 10 }, [], {
    bgcolor: COLORS.darkBlue,
    color: COLORS.white,
    size: '12',
  })
  presets.tc_preroll_reset = button('Timecode settings', 'Preset master preroll reset', 'PRE\n0s', 'timecode_preset_preroll_reset', {}, [], {
    bgcolor: COLORS.grey,
    color: COLORS.white,
    size: '12',
  })
  presets.tc_display_generated = presetDisplay('Timecode live readouts', 'Generated timecode display', `GEN\n$(${labelPrefix}:tc_generated_text)`, COLORS.darkBlue)
  presets.tc_display_received = presetDisplay('Timecode live readouts', 'Received timecode display', `RX\n$(${labelPrefix}:tc_received_text)`, COLORS.darkBlue)
  presets.tc_display_artnet = presetDisplay('Timecode live readouts', 'Art-Net input display', `ARTNET\n$(${labelPrefix}:tc_artnet_in_text)`, COLORS.darkBlue)
  presets.tc_display_ltc = presetDisplay('Timecode live readouts', 'LTC input display', `LTC IN\n$(${labelPrefix}:tc_ltc_in_text)`, COLORS.darkBlue)
  presets.tc_display_output = presetDisplay('Timecode live readouts', 'Output timecode display', `OUT\n$(${labelPrefix}:tc_output_text)`, COLORS.darkBlue)
  presets.tc_display_ltc_out = presetDisplay('Timecode live readouts', 'LTC output display', `LTC OUT\n$(${labelPrefix}:tc_ltc_out_text)`, COLORS.darkBlue)
  presets.tc_display_state = presetDisplay('Timecode live readouts', 'Timecode state display', `STATE\n$(${labelPrefix}:tc_state_mode)`, COLORS.grey)
  presets.tc_display_source = presetDisplay('Timecode live readouts', 'Timecode source display', `SRC\n$(${labelPrefix}:tc_active_source)`, COLORS.grey)
  presets.tc_display_current_preset = presetDisplay('Timecode live readouts', 'Current preset display', `PRESET\n$(${labelPrefix}:tc_current_preset_name)`, COLORS.purple)

  const splitCounters = [
    ['received', 'RX'],
    ['artnet_in', 'AN'],
    ['ltc_in', 'LTC'],
    ['generated', 'GEN'],
    ['output', 'OUT'],
    ['ltc_out', 'LTO'],
  ]
  for (const [id, title] of splitCounters) {
    presets[`tc_split_${id}`] = presetDisplay(
      'Timecode split readouts',
      `Timecode split ${id}`,
      `${title} $(${labelPrefix}:tc_${id}_hh):$(${labelPrefix}:tc_${id}_mm):$(${labelPrefix}:tc_${id}_ss):$(${labelPrefix}:tc_${id}_ff)`,
      COLORS.grey
    )
  }

  for (const preset of getDynamicPresets(self)) {
    const index = Number(preset.index)
    const loadKey = `tc_load_${index}`
    const playKey = `tc_play_${index}`

    presets[loadKey] = button(
      'Timecode preset load (dynamic)',
      `Timecode Load Preset ${index} - ${preset.name || `Preset ${index}`}`,
      formatPresetText('LOAD', preset),
      'timecode_preset_load',
      { index: String(index) },
      [{ feedbackId: 'current_preset', options: { index: String(index) }, style: { color: COLORS.white, bgcolor: COLORS.blue } }],
      { bgcolor: COLORS.darkBlue, color: COLORS.white, size: '12' }
    )

    presets[playKey] = button(
      'Timecode preset play (dynamic)',
      `Timecode Play Preset ${index} - ${preset.name || `Preset ${index}`}`,
      formatPresetText('GO', preset),
      'timecode_preset_play',
      { index: String(index) },
      [{ feedbackId: 'current_preset', options: { index: String(index) }, style: { color: COLORS.black, bgcolor: COLORS.green } }],
      { bgcolor: COLORS.greenDark, color: COLORS.white, size: '12' }
    )
  }

  const linked = Array.isArray(self.state?.linkedMachines) ? self.state.linkedMachines : []
  for (let i = 1; i <= linked.length; i++) {
    presets[`linked_perf_${i}`] = button(
      'Linked machines performance',
      `Linked machine ${i} performance`,
      `$(${labelPrefix}:linked_${i}_perf_summary)`,
      null,
      {},
      [
        {
          feedbackId: 'linked_machine_online',
          options: { index: i },
          style: { color: COLORS.white, bgcolor: COLORS.greenDark },
        },
      ],
      { bgcolor: COLORS.redDark, color: COLORS.white, size: '12' }
    )

    presets[`linked_link_${i}`] = button(
      'Linked machines links',
      `Linked machine ${i} link`,
      `$(${labelPrefix}:linked_${i}_link_summary)`,
      null,
      {},
      [
        {
          feedbackId: 'linked_machine_online',
          options: { index: i },
          style: { color: COLORS.white, bgcolor: COLORS.darkBlue },
        },
      ],
      { bgcolor: COLORS.grey, color: COLORS.white, size: '12' }
    )
  }

  self.setPresetDefinitions(presets)
}
