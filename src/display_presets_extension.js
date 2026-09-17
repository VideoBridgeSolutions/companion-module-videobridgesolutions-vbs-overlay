const DISPLAY_PRESET_OSC_PATH = '/vbs/display/preset/recall'

const instanceRefs = new Set()

function registerInstance(self) {
  if (!self) return

  for (const ref of Array.from(instanceRefs)) {
    const current = ref.deref?.()
    if (!current) {
      instanceRefs.delete(ref)
      continue
    }
    if (current === self) return
  }

  instanceRefs.add(new WeakRef(self))
}

function normalizeDisplayPresets(snapshot) {
  const source = Array.isArray(snapshot?.displayPresets) ? snapshot.displayPresets : []
  return source
    .map((preset, idx) => ({
      index: Number.isFinite(Number(preset?.index)) ? Number(preset.index) : idx + 1,
      id: String(preset?.id || ''),
      name: String(preset?.name || `Display preset ${idx + 1}`).trim(),
      summary: String(preset?.summary || '').trim(),
      hotkey: String(preset?.hotkey || '').trim(),
    }))
    .filter((preset) => preset.index > 0)
    .sort((a, b) => a.index - b.index)
}

function presetSignature(presets) {
  return JSON.stringify((presets || []).map((p) => [p.index, p.id, p.name, p.summary, p.hotkey]))
}

function getPresets(self) {
  return Array.isArray(self?.state?.remoteDisplayPresets) ? self.state.remoteDisplayPresets : []
}

function getChoices(self) {
  const presets = getPresets(self)
  if (presets.length === 0) return [{ id: '0', label: 'No display presets available' }]
  return presets.map((preset) => ({
    id: String(preset.index),
    label: `${String(preset.index).padStart(2, '0')} - ${preset.name}${preset.hotkey && preset.hotkey !== 'None' ? ` [${preset.hotkey}]` : ''}`,
  }))
}

function safeKey(preset) {
  const raw = preset.id || `${preset.index}-${preset.name}`
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
}

function instanceMatchesStatusTarget(self, host, port) {
  try {
    const statusHost = String(self.getStatusHost?.() || self.config?.status_host || self.config?.host || '').trim().toLowerCase()
    const statusPort = Number(self.getStatusPort?.() || self.config?.status_port || 40555)
    return statusHost === String(host || '').trim().toLowerCase() && statusPort === Number(port)
  } catch {
    return false
  }
}

function updateFromSnapshot(snapshot, host, port) {
  const presets = normalizeDisplayPresets(snapshot)
  const signature = presetSignature(presets)

  for (const ref of Array.from(instanceRefs)) {
    const self = ref.deref?.()
    if (!self) {
      instanceRefs.delete(ref)
      continue
    }
    if (!instanceMatchesStatusTarget(self, host, port)) continue
    if (self.__vbsDisplayPresetSignature === signature) continue

    self.__vbsDisplayPresetSignature = signature
    self.state.remoteDisplayPresets = presets

    try { self.updateActions() } catch (err) { self.log?.('warn', `Display preset action refresh failed: ${err?.message || err}`) }
    try { self.updatePresets() } catch (err) { self.log?.('warn', `Display preset preset refresh failed: ${err?.message || err}`) }
  }
}

function wrapActions(originalActions) {
  return function updateActionsWithDisplayPresets(self) {
    registerInstance(self)
    if (!Array.isArray(self.state?.remoteDisplayPresets)) self.state.remoteDisplayPresets = []

    const setOriginal = self.setActionDefinitions.bind(self)
    self.setActionDefinitions = function setActionDefinitionsWithDisplayPresets(definitions) {
      const choices = getChoices(self)
      const dynamicDefault = choices[0]?.id || '0'
      const merged = Object.assign({}, definitions, {
        display_preset_recall: {
          name: 'Recall display presentation preset',
          options: [
            {
              id: 'index',
              type: 'dropdown',
              label: 'Display preset',
              default: dynamicDefault,
              choices,
            },
          ],
          callback: async function (event) {
            const index = Number(event.options.index)
            if (!Number.isFinite(index) || index <= 0) return
            await self.sendAndTrack(DISPLAY_PRESET_OSC_PATH, [index], {})
          },
        },
      })
      return setOriginal(merged)
    }

    try {
      return originalActions(self)
    } finally {
      self.setActionDefinitions = setOriginal
    }
  }
}

function wrapPresets(originalPresets) {
  return function updatePresetsWithDisplayPresets(self) {
    registerInstance(self)
    if (!Array.isArray(self.state?.remoteDisplayPresets)) self.state.remoteDisplayPresets = []

    const setOriginal = self.setPresetDefinitions.bind(self)
    self.setPresetDefinitions = function setPresetDefinitionsWithDisplayPresets(definitions) {
      const merged = Object.assign({}, definitions)
      for (const preset of getPresets(self)) {
        const key = `display_preset_${safeKey(preset)}`
        const shortName = preset.name.length > 14 ? `${preset.name.slice(0, 13)}…` : preset.name
        merged[key] = {
          type: 'button',
          category: 'Display presets (dynamic)',
          name: `Display preset ${preset.index} - ${preset.name}`,
          style: {
            text: `DISPLAY\n${shortName}`,
            size: '14',
            color: 0xffffff,
            bgcolor: 0x05185a,
          },
          steps: [
            {
              down: [
                {
                  actionId: 'display_preset_recall',
                  options: { index: String(preset.index) },
                },
              ],
              up: [],
            },
          ],
          feedbacks: [],
        }
      }
      return setOriginal(merged)
    }

    try {
      return originalPresets(self)
    } finally {
      self.setPresetDefinitions = setOriginal
    }
  }
}

function wrapRemoteStatus(originalRemoteStatus) {
  return Object.assign({}, originalRemoteStatus, {
    fetchStatus: async function fetchStatusWithDisplayPresets(...args) {
      const snapshot = await originalRemoteStatus.fetchStatus(...args)
      try { updateFromSnapshot(snapshot, args[0], args[1]) } catch { }
      return snapshot
    },
  })
}

module.exports = {
  wrapActions,
  wrapPresets,
  wrapRemoteStatus,
}
