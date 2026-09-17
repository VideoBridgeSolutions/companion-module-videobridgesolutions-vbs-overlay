const Module = require('node:module')

const originalActions = require('./actions')
const originalPresets = require('./presets')
const originalRemoteStatus = require('./remote_status')
const extension = require('./display_presets_extension')

const actionsPath = require.resolve('./actions')
const presetsPath = require.resolve('./presets')
const remoteStatusPath = require.resolve('./remote_status')

const wrappedActions = extension.wrapActions(originalActions)
const wrappedPresets = extension.wrapPresets(originalPresets)
const wrappedRemoteStatus = extension.wrapRemoteStatus(originalRemoteStatus)

const originalLoad = Module._load
Module._load = function vbsOverlayFix171Load(request, parent, isMain) {
  let resolved = ''
  try { resolved = Module._resolveFilename(request, parent, isMain) } catch { }

  if (resolved === actionsPath) return wrappedActions
  if (resolved === presetsPath) return wrappedPresets
  if (resolved === remoteStatusPath) return wrappedRemoteStatus
  return originalLoad.call(this, request, parent, isMain)
}

try {
  require('./main')
} finally {
  Module._load = originalLoad
}
