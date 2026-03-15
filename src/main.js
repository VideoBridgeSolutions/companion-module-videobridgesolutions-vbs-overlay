const { InstanceBase, Regex, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const { OscSender } = require('./osc')
const { OSC_PATHS } = require('./constants')
const { pingStatus, fetchStatus } = require('./remote_status')
const UpgradeScripts = require('./upgrades')

const DEFAULT_STATUS_PORT = 40555
const DEFAULT_STATUS_POLL_MS = 2000
const DEFAULT_STATUS_TIMEOUT_MS = 1200
const MAX_MAIN_NETWORKS = 4
const MAX_OTHER_NETWORKS = 4
const MAX_DISPLAYS = 6
const MAX_DRIVES = 8
const MAX_LINKED_MACHINES = 8

function buildInitialTimecodeSnapshotState() {
  return {
    fps: '',
    sourceMode: '',
    activeSource: '',
    stateMode: '',
    transportState: '',
    senderEnabled: false,
    senderActive: false,
    receiverEnabled: false,
    receiverActive: false,
    artNetInputActive: false,
    ltcInputActive: false,
    ltcOutputEnabled: false,
    ltcOutputActive: false,

    receivedFrame: '',
    receivedText: '',
    receivedSource: '',
    receivedUtc: '',
    artNetInFrame: '',
    artNetInText: '',
    artNetInUtc: '',
    ltcInFrame: '',
    ltcInText: '',
    ltcInUtc: '',
    generatedFrame: '',
    generatedText: '',
    generatorRunning: false,
    generatorPaused: false,
    outputFrame: '',
    outputText: '',
    ltcOutFrame: '',
    ltcOutText: '',

    rxPacketsReceived: '',
    rxValidPackets: '',
    rxInvalidPackets: '',
    txPacketsSent: '',
    rxLastSourceIp: '',
    rxLastSourceEndpoint: '',
    rxLastDecodedText: '',
    rxLastPacketValid: false,
    rxLastPacketDetail: '',
    rxBindEndpoint: '',
    rxBindMode: '',
    rxLocalInterfaces: '',
    rxLastOpcodeText: '',
    rxLastPacketSize: '',
    rxFirstBytesHex: '',
    rxOpTimeCodeCount: '',
    rxOpPollReplyCount: '',
    rxOpPollCount: '',
    rxOpOtherCount: '',
    txLastTarget: '',
    txTargetsSummary: '',
    txLastPacketText: '',
    presetCount: 0,
    presetMasterPrerollSeconds: 0,
    presetListSummary: '',
    presets: [],
  }
}


function buildInitialState() {
  return {
    transportState: 'stopped',
    timecodeSender: false,
    timecodeReceiver: false,
    midiSender: false,
    midiReceiver: false,
    currentPreset: '',
    ltcLevelDb: 0,
    externalDelayFrames: 0,
    generatorDelayFrames: 0,
    deskLock: false,
    showMode: false,
    colors: Array.from({ length: 10 }, () => 0),
    lastOscPath: '',
    lastOscArgs: '',
    lastOscAt: '',
    lastSyncMode: '',

    remoteOnline: false,
    remoteLinkState: 'disabled',
    remoteLinkRttMs: '',
    remoteLastPollAt: '',
    remoteTimestampUtc: '',
    remoteMachineId: '',
    remoteMac: '',
    remoteAllowVnc: false,
    remoteHostName: '',
    remoteVersion: '',
    remoteLanText: '',
    remoteCpuName: '',
    remoteCpuPercent: '',
    remoteRamPercent: '',
    remoteRamTotalGb: '',
    remoteRamUsedGb: '',
    remoteGpuName: '',
    remoteGpuPercent: '',
    remoteGpuMemPercent: '',
    remoteGpuTempC: '',
    remoteTickCountMs: '',
    remoteSharedDriveLettersCsv: '',
    remoteSharedDriveSharesCsv: '',
    remoteNetworks: [],
    remoteOtherNetworks: [],
    remoteDisplays: [],
    remoteDrives: [],
    remoteTimecode: buildInitialTimecodeSnapshotState(),
    linkedMachines: [],
  }
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function formatNumber(value, decimals = 1) {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return num.toFixed(decimals)
}

function formatInteger(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return String(Math.round(num))
}

function formatBool(value, trueText = 'on', falseText = 'off') {
  return value ? trueText : falseText
}

function formatUptime(ms) {
  const totalMs = Number(ms)
  if (!Number.isFinite(totalMs) || totalMs < 0) return ''

  let totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  totalSeconds -= days * 86400
  const hours = Math.floor(totalSeconds / 3600)
  totalSeconds -= hours * 3600
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds - minutes * 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`
}

function driveToValues(drive) {
  const totalBytes = Number(drive?.totalBytes)
  const freeBytes = Number(drive?.freeBytes)
  const totalGb = Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes / (1024 ** 3) : null
  const freeGb = Number.isFinite(freeBytes) && freeBytes >= 0 ? freeBytes / (1024 ** 3) : null
  const usedGb = totalGb != null && freeGb != null ? Math.max(0, totalGb - freeGb) : null
  const freePct = totalBytes > 0 && Number.isFinite(freeBytes) ? (freeBytes * 100) / totalBytes : null

  return {
    letter: String(drive?.letter || ''),
    type: String(drive?.typeText || ''),
    totalGb: totalGb != null ? totalGb.toFixed(1) : '',
    freeGb: freeGb != null ? freeGb.toFixed(1) : '',
    usedGb: usedGb != null ? usedGb.toFixed(1) : '',
    freePercent: freePct != null ? freePct.toFixed(1) : '',
    summary: drive?.letter
      ? `${drive.letter} ${drive?.typeText || ''} ${totalGb != null ? totalGb.toFixed(1) + 'GB' : ''} ${freeGb != null ? freeGb.toFixed(1) + 'GB free' : ''}`.trim()
      : '',
  }
}

function networkSummary(network) {
  if (!network) return ''
  return [network.name, network.state, network.address, network.ipMode].filter(Boolean).join(' | ')
}

function displaySummary(display) {
  if (!display) return ''
  return [display.name, display.resolution, display.refreshHz ? `${display.refreshHz}Hz` : '', display.isPrimary ? 'Primary' : '']
    .filter(Boolean)
    .join(' | ')
}


function normalizeRemoteTimecodePresetList(presets) {
  if (!Array.isArray(presets)) return []
  return presets
    .map((preset, idx) => {
      const index = Number.parseInt(preset?.index ?? idx + 1, 10)
      if (!Number.isFinite(index) || index <= 0) return null
      return {
        index,
        name: String(preset?.name || `Preset ${index}`).trim(),
        timecode: String(preset?.timecode || ''),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index)
}

function formatPresetListSummary(presets) {
  return presets
    .map((preset) => `${String(preset.index).padStart(2, '0')} ${preset.name}${preset.timecode ? ` @ ${preset.timecode}` : ''}`)
    .join(' | ')
}

function arePresetListsEqual(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (Number(a[i]?.index) !== Number(b[i]?.index)) return false
    if (String(a[i]?.name || '') !== String(b[i]?.name || '')) return false
    if (String(a[i]?.timecode || '') !== String(b[i]?.timecode || '')) return false
  }
  return true
}


function normalizeLinkedMachines(linkedMachines) {
  if (!Array.isArray(linkedMachines)) return []
  return linkedMachines
    .map((machine, idx) => ({
      slot: idx + 1,
      machineId: String(machine?.machineId || ''),
      hostName: String(machine?.hostName || machine?.machineId || `Linked ${idx + 1}`),
      ip: String(machine?.ip || ''),
      statusPort: Number.isFinite(Number(machine?.statusPort)) ? Number(machine.statusPort) : DEFAULT_STATUS_PORT,
      version: String(machine?.version || ''),
      machineColorHex: String(machine?.machineColorHex || ''),
      isLinked: !!machine?.isLinked,
      isOnline: !!machine?.isOnline,
      cpuPercent: Number.isFinite(Number(machine?.cpuPercent)) ? Number(machine.cpuPercent) : null,
      ramPercent: Number.isFinite(Number(machine?.ramPercent)) ? Number(machine.ramPercent) : null,
      gpuPercent: Number.isFinite(Number(machine?.gpuPercent)) ? Number(machine.gpuPercent) : null,
      vramPercent: Number.isFinite(Number(machine?.vramPercent)) ? Number(machine.vramPercent) : null,
      linkRttMs: Number.isFinite(Number(machine?.linkRttMs)) ? Number(machine.linkRttMs) : null,
      linkLossPercent: Number.isFinite(Number(machine?.linkLossPercent)) ? Number(machine.linkLossPercent) : null,
    }))
    .slice(0, MAX_LINKED_MACHINES)
}

function areLinkedMachineListsEqual(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (String(a[i]?.machineId || '') !== String(b[i]?.machineId || '')) return false
    if (String(a[i]?.hostName || '') !== String(b[i]?.hostName || '')) return false
  }
  return true
}

function formatLinkedMachineListSummary(linkedMachines) {
  return (Array.isArray(linkedMachines) ? linkedMachines : [])
    .map((machine, idx) => `${String(idx + 1).padStart(2, '0')} ${machine.hostName}${machine.ip ? ` @ ${machine.ip}` : ''}`)
    .join(' | ')
}

function parseTimecodeText(text) {
  const raw = String(text || '').trim()
  const match = raw.match(/^(\d{2}|--):(\d{2}|--):(\d{2}|--):(\d{2}|--)$/)
  if (!match) {
    return { hh: '', mm: '', ss: '', ff: '' }
  }
  return {
    hh: match[1],
    mm: match[2],
    ss: match[3],
    ff: match[4],
  }
}

function findPresetByIndex(presets, index) {
  const wanted = Number(index)
  if (!Number.isFinite(wanted) || wanted <= 0) return null
  return (Array.isArray(presets) ? presets : []).find((preset) => Number(preset.index) === wanted) || null
}

class VbsOverlayOscInstance extends InstanceBase {
  constructor(internal) {
    super(internal)
    this.config = {}
    this.state = buildInitialState()
    this.osc = new OscSender()
    this.statusPollTimer = null
    this.statusPollInFlight = false
  }

  async init(config) {
    this.config = config || {}
    this.log('info', 'Initializing VBS Overlay OSC module (API 1.14)')
    this.updateActions()
    this.updateFeedbacks()
    this.updateVariableDefinitions()
    this.updatePresets()
    this.pushAllVariableValues()
    this.refreshStatus()
    this.restartStatusPolling()
  }

  async destroy() {
    this.stopStatusPolling()
    this.osc.close()
    this.log('debug', 'destroy')
  }

  async configUpdated(config) {
    this.config = config || {}
    this.refreshStatus()
    this.pushAllVariableValues()
    this.restartStatusPolling()
  }

  refreshStatus() {
    if (!this.config.host || !this.config.port) {
      this.updateStatus(InstanceStatus.BadConfig || 'bad_config', 'Host or port missing')
      return
    }

    this.updateStatus(InstanceStatus.Ok || 'ok')
  }

  getConfigFields() {
    return [
      {
        type: 'textinput',
        id: 'host',
        label: 'Target host / IP',
        width: 8,
        default: '127.0.0.1',
        regex: Regex.HOSTNAME,
        required: true,
      },
      {
        type: 'textinput',
        id: 'port',
        label: 'Target OSC port',
        width: 4,
        default: '7000',
        regex: Regex.PORT,
        required: true,
      },
      {
        type: 'checkbox',
        id: 'status_enable',
        label: 'Poll VBS remote status for live variables',
        width: 12,
        default: true,
      },
      {
        type: 'textinput',
        id: 'status_host',
        label: 'Status host / IP (leave blank = same as target host)',
        width: 8,
        default: '',
        required: false,
      },
      {
        type: 'textinput',
        id: 'status_port',
        label: 'Status TCP port',
        width: 4,
        default: String(DEFAULT_STATUS_PORT),
        regex: Regex.PORT,
        required: true,
      },
      {
        type: 'textinput',
        id: 'status_poll_ms',
        label: 'Status poll interval (ms)',
        width: 6,
        default: String(DEFAULT_STATUS_POLL_MS),
        required: true,
      },
      {
        type: 'textinput',
        id: 'status_timeout_ms',
        label: 'Status timeout (ms)',
        width: 6,
        default: String(DEFAULT_STATUS_TIMEOUT_MS),
        required: true,
      },
    ]
  }

  updateActions() {
    UpdateActions(this)
  }

  updateFeedbacks() {
    UpdateFeedbacks(this)
  }

  updateVariableDefinitions() {
    UpdateVariableDefinitions(this)
  }

  updatePresets() {
    UpdatePresets(this)
  }

  refreshDynamicPresetDefinitions() {
    this.updateActions()
    this.updateFeedbacks()
    this.updatePresets()
  }

  getBooleanTargetState(target) {
    switch (target) {
      case 'timecode_sender':
        return this.state.timecodeSender
      case 'timecode_receiver':
        return this.state.timecodeReceiver
      case 'midi_sender':
        return this.state.midiSender
      case 'midi_receiver':
        return this.state.midiReceiver
      case 'desk_lock':
        return this.state.deskLock
      case 'show_mode':
        return this.state.showMode
      default:
        return false
    }
  }

  getPatchForKnownCustomCommand(path, args) {
    const first = Number(args[0] ?? 0)

    switch (path) {
      case OSC_PATHS.deskLock:
        return { deskLock: first === 1 }
      case OSC_PATHS.showMode:
        return { showMode: first === 1 }
      case OSC_PATHS.color: {
        const second = Number(args[1] ?? 0)
        const colors = [...this.state.colors]
        if (first >= 1 && first <= 10) colors[first - 1] = second
        return { colors }
      }
      case OSC_PATHS.midiSender:
        return { midiSender: first === 1 }
      case OSC_PATHS.midiSenderStart:
        return { midiSender: true }
      case OSC_PATHS.midiSenderStop:
        return { midiSender: false }
      case OSC_PATHS.midiReceiver:
        return { midiReceiver: first === 1 }
      case OSC_PATHS.timecodePlay:
        return { transportState: 'playing' }
      case OSC_PATHS.timecodePause:
        return { transportState: 'paused' }
      case OSC_PATHS.timecodeStop:
        return { transportState: 'stopped' }
      case OSC_PATHS.timecodeSender:
        return { timecodeSender: first === 1 }
      case OSC_PATHS.timecodeReceiver:
        return { timecodeReceiver: first === 1 }
      case OSC_PATHS.timecodeLtcLevel:
        return { ltcLevelDb: first }
      case OSC_PATHS.timecodeLtcLevelReset:
        return { ltcLevelDb: 0 }
      case OSC_PATHS.timecodeExternalDelay:
        return { externalDelayFrames: first }
      case OSC_PATHS.timecodeExternalDelayReset:
        return { externalDelayFrames: 0 }
      case OSC_PATHS.timecodeGeneratorDelay:
        return { generatorDelayFrames: first }
      case OSC_PATHS.timecodeGeneratorDelayReset:
        return { generatorDelayFrames: 0 }
      case OSC_PATHS.timecodePresetLoad:
        return { currentPreset: first }
      case OSC_PATHS.timecodePresetPlay:
        return { currentPreset: first, transportState: 'playing' }
      case OSC_PATHS.syncRepository:
        return { lastSyncMode: 'repository' }
      case OSC_PATHS.syncProject:
        return { lastSyncMode: first === 2 ? 'project_relaunch' : 'project' }
      default:
        return {}
    }
  }

  isStatusPollingEnabled() {
    return this.config.status_enable !== false
  }

  getStatusHost() {
    return String(this.config.status_host || this.config.host || '').trim()
  }

  getStatusPort() {
    return clampInt(this.config.status_port, DEFAULT_STATUS_PORT, 1, 65535)
  }

  getStatusPollMs() {
    return clampInt(this.config.status_poll_ms, DEFAULT_STATUS_POLL_MS, 500, 60000)
  }

  getStatusTimeoutMs() {
    return clampInt(this.config.status_timeout_ms, DEFAULT_STATUS_TIMEOUT_MS, 200, 10000)
  }

  stopStatusPolling() {
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer)
      this.statusPollTimer = null
    }
    this.statusPollInFlight = false
  }

  restartStatusPolling() {
    this.stopStatusPolling()

    if (!this.isStatusPollingEnabled()) {
      this.state.remoteOnline = false
      this.state.remoteLinkState = 'disabled'
      this.state.remoteLinkRttMs = ''
      this.state.remoteLastPollAt = ''
      this.pushAllVariableValues()
      return
    }

    const host = this.getStatusHost()
    const port = this.getStatusPort()
    if (!host || !port) {
      this.state.remoteOnline = false
      this.state.remoteLinkState = 'bad_config'
      this.pushAllVariableValues()
      return
    }

    const poll = async () => {
      try {
        await this.pollRemoteStatus()
      } catch (err) {
        this.log('warn', `Remote status poll failed: ${err?.message || err}`)
      }
    }

    void poll()
    this.statusPollTimer = setInterval(() => void poll(), this.getStatusPollMs())
    this.statusPollTimer.unref?.()
  }

  async pollRemoteStatus() {
    if (this.statusPollInFlight) return
    this.statusPollInFlight = true

    const host = this.getStatusHost()
    const port = this.getStatusPort()
    const timeoutMs = this.getStatusTimeoutMs()

    try {
      let rttMs = ''
      try {
        rttMs = await pingStatus(host, port, timeoutMs)
      } catch {
        rttMs = ''
      }

      const snapshot = await fetchStatus(host, port, timeoutMs)
      this.applyRemoteSnapshot(snapshot, rttMs)
    } catch (err) {
      this.state.remoteOnline = false
      this.state.remoteLinkState = 'offline'
      this.state.remoteLinkRttMs = ''
      this.state.remoteLastPollAt = new Date().toISOString()
      this.pushAllVariableValues()
      this.checkAllFeedbacks()
      throw err
    } finally {
      this.statusPollInFlight = false
    }
  }

  applyRemoteSnapshot(snapshot, rttMs) {
    snapshot = snapshot || {}
    this.state.remoteOnline = true
    this.state.remoteLinkState = 'online'
    this.state.remoteLinkRttMs = rttMs === '' ? '' : String(rttMs)
    this.state.remoteLastPollAt = new Date().toISOString()
    this.state.remoteTimestampUtc = String(snapshot.timestampUtc || '')
    this.state.remoteMachineId = String(snapshot.machineId || '')
    this.state.remoteMac = String(snapshot.mac || '')
    this.state.remoteAllowVnc = !!snapshot.allowVnc
    this.state.remoteHostName = String(snapshot.hostName || '')
    this.state.remoteVersion = String(snapshot.version || '')
    this.state.remoteLanText = String(snapshot.lanText || '')
    this.state.remoteCpuName = String(snapshot.cpuName || '')
    this.state.remoteCpuPercent = snapshot.cpuPercent
    this.state.remoteRamPercent = snapshot.ramPercent
    this.state.remoteRamTotalGb = snapshot.ramTotalGb
    this.state.remoteRamUsedGb = snapshot.ramUsedGb
    this.state.remoteGpuName = String(snapshot.gpuName || '')
    this.state.remoteGpuPercent = snapshot.gpuPercent
    this.state.remoteGpuMemPercent = snapshot.gpuMemPercent
    this.state.remoteGpuTempC = snapshot.gpuTempC
    this.state.remoteTickCountMs = snapshot.tickCountMs
    this.state.remoteSharedDriveLettersCsv = String(snapshot.sharedDriveLettersCsv || '')
    this.state.remoteSharedDriveSharesCsv = String(snapshot.sharedDriveSharesCsv || '')
    this.state.remoteNetworks = Array.isArray(snapshot.networks) ? snapshot.networks : []
    this.state.remoteOtherNetworks = Array.isArray(snapshot.otherNetworks) ? snapshot.otherNetworks : []
    this.state.remoteDisplays = Array.isArray(snapshot.displays) ? snapshot.displays : []
    this.state.remoteDrives = Array.isArray(snapshot.drives) ? snapshot.drives : []

    const nextLinkedMachines = normalizeLinkedMachines(snapshot.linkedMachines || snapshot.LinkedMachines)
    const linkedMachinesChanged = !areLinkedMachineListsEqual(this.state.linkedMachines, nextLinkedMachines)
    this.state.linkedMachines = nextLinkedMachines

    const tc = snapshot.timecode || {}
    const nextPresets = normalizeRemoteTimecodePresetList(tc.presets)
    const presetsChanged = !arePresetListsEqual(this.state.remoteTimecode?.presets, nextPresets)

    this.state.remoteTimecode = {
      fps: tc.fps ?? '',
      sourceMode: String(tc.sourceMode || ''),
      activeSource: String(tc.activeSource || ''),
      stateMode: String(tc.stateMode || ''),
      transportState: String(tc.transportState || ''),
      senderEnabled: !!tc.senderEnabled,
      senderActive: !!tc.senderActive,
      receiverEnabled: !!tc.receiverEnabled,
      receiverActive: !!tc.receiverActive,
      artNetInputActive: !!tc.artNetInputActive,
      ltcInputActive: !!tc.ltcInputActive,
      ltcOutputEnabled: !!tc.ltcOutputEnabled,
      ltcOutputActive: !!tc.ltcOutputActive,

      receivedFrame: tc.receivedFrame ?? '',
      receivedText: String(tc.receivedText || ''),
      receivedSource: String(tc.receivedSource || ''),
      receivedUtc: String(tc.receivedUtc || ''),
      artNetInFrame: tc.artNetInFrame ?? '',
      artNetInText: String(tc.artNetInText || ''),
      artNetInUtc: String(tc.artNetInUtc || ''),
      ltcInFrame: tc.ltcInFrame ?? '',
      ltcInText: String(tc.ltcInText || ''),
      ltcInUtc: String(tc.ltcInUtc || ''),
      generatedFrame: tc.generatedFrame ?? '',
      generatedText: String(tc.generatedText || ''),
      generatorRunning: !!tc.generatorRunning,
      generatorPaused: !!tc.generatorPaused,
      outputFrame: tc.outputFrame ?? '',
      outputText: String(tc.outputText || ''),
      ltcOutFrame: tc.ltcOutFrame ?? '',
      ltcOutText: String(tc.ltcOutText || ''),

      rxPacketsReceived: tc.rxPacketsReceived ?? '',
      rxValidPackets: tc.rxValidPackets ?? '',
      rxInvalidPackets: tc.rxInvalidPackets ?? '',
      txPacketsSent: tc.txPacketsSent ?? '',
      rxLastSourceIp: String(tc.rxLastSourceIp || ''),
      rxLastSourceEndpoint: String(tc.rxLastSourceEndpoint || ''),
      rxLastDecodedText: String(tc.rxLastDecodedText || ''),
      rxLastPacketValid: !!tc.rxLastPacketValid,
      rxLastPacketDetail: String(tc.rxLastPacketDetail || ''),
      rxBindEndpoint: String(tc.rxBindEndpoint || ''),
      rxBindMode: String(tc.rxBindMode || ''),
      rxLocalInterfaces: String(tc.rxLocalInterfaces || ''),
      rxLastOpcodeText: String(tc.rxLastOpcodeText || ''),
      rxLastPacketSize: tc.rxLastPacketSize ?? '',
      rxFirstBytesHex: String(tc.rxFirstBytesHex || ''),
      rxOpTimeCodeCount: tc.rxOpTimeCodeCount ?? '',
      rxOpPollReplyCount: tc.rxOpPollReplyCount ?? '',
      rxOpPollCount: tc.rxOpPollCount ?? '',
      rxOpOtherCount: tc.rxOpOtherCount ?? '',
      txLastTarget: String(tc.txLastTarget || ''),
      txTargetsSummary: String(tc.txTargetsSummary || ''),
      txLastPacketText: String(tc.txLastPacketText || ''),
      presetCount: Number.isFinite(Number(tc.presetCount)) ? Number(tc.presetCount) : nextPresets.length,
      presetMasterPrerollSeconds: Number.isFinite(Number(tc.presetMasterPrerollSeconds)) ? Number(tc.presetMasterPrerollSeconds) : 0,
      presetListSummary: formatPresetListSummary(nextPresets),
      presets: nextPresets,
    }

    if (this.state.remoteTimecode.transportState) {
      this.state.transportState = this.state.remoteTimecode.transportState
    }
    this.state.timecodeSender = !!this.state.remoteTimecode.senderEnabled
    this.state.timecodeReceiver = !!this.state.remoteTimecode.receiverEnabled

    if (presetsChanged) {
      this.log('debug', `Remote preset list updated (${nextPresets.length} presets)`)
    }
    if (linkedMachinesChanged) {
      this.log('debug', `Linked machine list updated (${nextLinkedMachines.length} machines)`)
    }
    if (presetsChanged || linkedMachinesChanged) {
      this.refreshDynamicPresetDefinitions()
    }

    this.pushAllVariableValues()
    this.checkAllFeedbacks()
  }

  pushAllVariableValues() {
    const ramTotal = Number(this.state.remoteRamTotalGb)
    const ramUsed = Number(this.state.remoteRamUsedGb)
    const ramFree = Number.isFinite(ramTotal) && Number.isFinite(ramUsed) ? Math.max(0, ramTotal - ramUsed) : null
    const currentPresetMeta = findPresetByIndex(this.state.remoteTimecode.presets, this.state.currentPreset)
    const tcReceivedSplit = parseTimecodeText(this.state.remoteTimecode.receivedText)
    const tcArtNetSplit = parseTimecodeText(this.state.remoteTimecode.artNetInText)
    const tcLtcInSplit = parseTimecodeText(this.state.remoteTimecode.ltcInText)
    const tcGeneratedSplit = parseTimecodeText(this.state.remoteTimecode.generatedText)
    const tcOutputSplit = parseTimecodeText(this.state.remoteTimecode.outputText)
    const tcLtcOutSplit = parseTimecodeText(this.state.remoteTimecode.ltcOutText)

    const values = {
      transport_state: this.state.transportState,
      transport_label: String(this.state.transportState || '').toUpperCase(),
      timecode_sender: this.state.timecodeSender ? 'on' : 'off',
      timecode_receiver: this.state.timecodeReceiver ? 'on' : 'off',
      midi_sender: this.state.midiSender ? 'on' : 'off',
      midi_receiver: this.state.midiReceiver ? 'on' : 'off',
      current_preset: this.state.currentPreset,
      ltc_level_db: this.state.ltcLevelDb,
      external_delay_frames: this.state.externalDelayFrames,
      generator_delay_frames: this.state.generatorDelayFrames,
      desk_lock: this.state.deskLock ? 'locked' : 'unlocked',
      show_mode: this.state.showMode ? 'on' : 'off',
      last_osc_path: this.state.lastOscPath,
      last_osc_args: this.state.lastOscArgs,
      last_osc_at: this.state.lastOscAt,
      last_sync_mode: this.state.lastSyncMode,

      status_polling: this.isStatusPollingEnabled() ? 'enabled' : 'disabled',
      status_host: this.getStatusHost(),
      status_port: String(this.getStatusPort()),
      status_poll_ms: String(this.getStatusPollMs()),
      remote_online: this.state.remoteOnline ? 'on' : 'off',
      remote_link_state: this.state.remoteLinkState,
      remote_link_rtt_ms: this.state.remoteLinkRttMs,
      remote_last_poll_at: this.state.remoteLastPollAt,
      remote_timestamp_utc: this.state.remoteTimestampUtc,
      remote_machine_id: this.state.remoteMachineId,
      remote_mac: this.state.remoteMac,
      remote_allow_vnc: formatBool(this.state.remoteAllowVnc, 'yes', 'no'),
      remote_hostname: this.state.remoteHostName,
      remote_version: this.state.remoteVersion,
      remote_lan_text: this.state.remoteLanText,
      remote_cpu_name: this.state.remoteCpuName,
      remote_cpu_percent: formatNumber(this.state.remoteCpuPercent, 1),
      remote_ram_percent: formatNumber(this.state.remoteRamPercent, 1),
      remote_ram_total_gb: formatNumber(this.state.remoteRamTotalGb, 1),
      remote_ram_used_gb: formatNumber(this.state.remoteRamUsedGb, 1),
      remote_ram_free_gb: ramFree != null ? ramFree.toFixed(1) : '',
      remote_gpu_name: this.state.remoteGpuName,
      remote_gpu_percent: formatNumber(this.state.remoteGpuPercent, 1),
      remote_gpu_mem_percent: formatNumber(this.state.remoteGpuMemPercent, 1),
      remote_gpu_temp_c: formatNumber(this.state.remoteGpuTempC, 1),
      remote_uptime_ms: formatInteger(this.state.remoteTickCountMs),
      remote_uptime_hms: formatUptime(this.state.remoteTickCountMs),
      remote_drives_count: String(this.state.remoteDrives.length),
      remote_networks_count: String(this.state.remoteNetworks.length),
      remote_other_networks_count: String(this.state.remoteOtherNetworks.length),
      remote_displays_count: String(this.state.remoteDisplays.length),
      remote_shared_drive_letters_csv: this.state.remoteSharedDriveLettersCsv,
      remote_shared_drive_shares_csv: this.state.remoteSharedDriveSharesCsv,
      linked_count: formatInteger(this.state.linkedMachines.length),
      linked_list: formatLinkedMachineListSummary(this.state.linkedMachines),

      tc_fps: formatInteger(this.state.remoteTimecode.fps),
      tc_source_mode: this.state.remoteTimecode.sourceMode,
      tc_active_source: this.state.remoteTimecode.activeSource,
      tc_state_mode: this.state.remoteTimecode.stateMode,
      tc_transport_state: this.state.remoteTimecode.transportState,
      tc_sender_enabled: formatBool(this.state.remoteTimecode.senderEnabled, 'on', 'off'),
      tc_sender_active: formatBool(this.state.remoteTimecode.senderActive, 'on', 'off'),
      tc_receiver_enabled: formatBool(this.state.remoteTimecode.receiverEnabled, 'on', 'off'),
      tc_receiver_active: formatBool(this.state.remoteTimecode.receiverActive, 'on', 'off'),
      tc_artnet_input_active: formatBool(this.state.remoteTimecode.artNetInputActive, 'on', 'off'),
      tc_ltc_input_active: formatBool(this.state.remoteTimecode.ltcInputActive, 'on', 'off'),
      tc_ltc_output_enabled: formatBool(this.state.remoteTimecode.ltcOutputEnabled, 'on', 'off'),
      tc_ltc_output_active: formatBool(this.state.remoteTimecode.ltcOutputActive, 'on', 'off'),

      tc_received_frame: formatInteger(this.state.remoteTimecode.receivedFrame),
      tc_received_text: this.state.remoteTimecode.receivedText,
      tc_received_source: this.state.remoteTimecode.receivedSource,
      tc_received_utc: this.state.remoteTimecode.receivedUtc,
      tc_artnet_in_frame: formatInteger(this.state.remoteTimecode.artNetInFrame),
      tc_artnet_in_text: this.state.remoteTimecode.artNetInText,
      tc_artnet_in_utc: this.state.remoteTimecode.artNetInUtc,
      tc_ltc_in_frame: formatInteger(this.state.remoteTimecode.ltcInFrame),
      tc_ltc_in_text: this.state.remoteTimecode.ltcInText,
      tc_ltc_in_utc: this.state.remoteTimecode.ltcInUtc,
      tc_generated_frame: formatInteger(this.state.remoteTimecode.generatedFrame),
      tc_generated_text: this.state.remoteTimecode.generatedText,
      tc_generator_running: formatBool(this.state.remoteTimecode.generatorRunning, 'on', 'off'),
      tc_generator_paused: formatBool(this.state.remoteTimecode.generatorPaused, 'on', 'off'),
      tc_output_frame: formatInteger(this.state.remoteTimecode.outputFrame),
      tc_output_text: this.state.remoteTimecode.outputText,
      tc_ltc_out_frame: formatInteger(this.state.remoteTimecode.ltcOutFrame),
      tc_ltc_out_text: this.state.remoteTimecode.ltcOutText,

      tc_rx_packets_received: formatInteger(this.state.remoteTimecode.rxPacketsReceived),
      tc_rx_valid_packets: formatInteger(this.state.remoteTimecode.rxValidPackets),
      tc_rx_invalid_packets: formatInteger(this.state.remoteTimecode.rxInvalidPackets),
      tc_tx_packets_sent: formatInteger(this.state.remoteTimecode.txPacketsSent),
      tc_rx_last_source_ip: this.state.remoteTimecode.rxLastSourceIp,
      tc_rx_last_source_endpoint: this.state.remoteTimecode.rxLastSourceEndpoint,
      tc_rx_last_decoded_text: this.state.remoteTimecode.rxLastDecodedText,
      tc_rx_last_packet_valid: formatBool(this.state.remoteTimecode.rxLastPacketValid, 'yes', 'no'),
      tc_rx_last_packet_detail: this.state.remoteTimecode.rxLastPacketDetail,
      tc_rx_bind_endpoint: this.state.remoteTimecode.rxBindEndpoint,
      tc_rx_bind_mode: this.state.remoteTimecode.rxBindMode,
      tc_rx_local_interfaces: this.state.remoteTimecode.rxLocalInterfaces,
      tc_rx_last_opcode_text: this.state.remoteTimecode.rxLastOpcodeText,
      tc_rx_last_packet_size: formatInteger(this.state.remoteTimecode.rxLastPacketSize),
      tc_rx_first_bytes_hex: this.state.remoteTimecode.rxFirstBytesHex,
      tc_rx_op_timecode_count: formatInteger(this.state.remoteTimecode.rxOpTimeCodeCount),
      tc_rx_op_pollreply_count: formatInteger(this.state.remoteTimecode.rxOpPollReplyCount),
      tc_rx_op_poll_count: formatInteger(this.state.remoteTimecode.rxOpPollCount),
      tc_rx_op_other_count: formatInteger(this.state.remoteTimecode.rxOpOtherCount),
      tc_tx_last_target: this.state.remoteTimecode.txLastTarget,
      tc_tx_targets_summary: this.state.remoteTimecode.txTargetsSummary,
      tc_tx_last_packet_text: this.state.remoteTimecode.txLastPacketText,
      tc_preset_count: formatInteger(this.state.remoteTimecode.presetCount),
      tc_preset_master_preroll_s: formatInteger(this.state.remoteTimecode.presetMasterPrerollSeconds),
      tc_preset_list: this.state.remoteTimecode.presetListSummary,
      tc_current_preset_name: String(currentPresetMeta?.name || ''),
      tc_current_preset_timecode: String(currentPresetMeta?.timecode || ''),
      tc_received_hh: tcReceivedSplit.hh,
      tc_received_mm: tcReceivedSplit.mm,
      tc_received_ss: tcReceivedSplit.ss,
      tc_received_ff: tcReceivedSplit.ff,
      tc_artnet_in_hh: tcArtNetSplit.hh,
      tc_artnet_in_mm: tcArtNetSplit.mm,
      tc_artnet_in_ss: tcArtNetSplit.ss,
      tc_artnet_in_ff: tcArtNetSplit.ff,
      tc_ltc_in_hh: tcLtcInSplit.hh,
      tc_ltc_in_mm: tcLtcInSplit.mm,
      tc_ltc_in_ss: tcLtcInSplit.ss,
      tc_ltc_in_ff: tcLtcInSplit.ff,
      tc_generated_hh: tcGeneratedSplit.hh,
      tc_generated_mm: tcGeneratedSplit.mm,
      tc_generated_ss: tcGeneratedSplit.ss,
      tc_generated_ff: tcGeneratedSplit.ff,
      tc_output_hh: tcOutputSplit.hh,
      tc_output_mm: tcOutputSplit.mm,
      tc_output_ss: tcOutputSplit.ss,
      tc_output_ff: tcOutputSplit.ff,
      tc_ltc_out_hh: tcLtcOutSplit.hh,
      tc_ltc_out_mm: tcLtcOutSplit.mm,
      tc_ltc_out_ss: tcLtcOutSplit.ss,
      tc_ltc_out_ff: tcLtcOutSplit.ff,
    }

    for (let i = 1; i <= 10; i++) {
      values[`color_${i}`] = this.state.colors[i - 1]
    }

    for (let i = 1; i <= MAX_MAIN_NETWORKS; i++) {
      const network = this.state.remoteNetworks[i - 1]
      values[`network_${i}_summary`] = networkSummary(network)
      values[`network_${i}_name`] = String(network?.name || '')
      values[`network_${i}_state`] = String(network?.state || '')
      values[`network_${i}_address`] = String(network?.address || '')
      values[`network_${i}_subnet_mask`] = String(network?.subnetMask || '')
      values[`network_${i}_ip_mode`] = String(network?.ipMode || '')
      values[`network_${i}_adapter_name`] = String(network?.adapterName || '')

      const other = this.state.remoteOtherNetworks[i - 1]
      values[`other_network_${i}_summary`] = networkSummary(other)
      values[`other_network_${i}_name`] = String(other?.name || '')
      values[`other_network_${i}_state`] = String(other?.state || '')
      values[`other_network_${i}_address`] = String(other?.address || '')
      values[`other_network_${i}_subnet_mask`] = String(other?.subnetMask || '')
      values[`other_network_${i}_ip_mode`] = String(other?.ipMode || '')
      values[`other_network_${i}_adapter_name`] = String(other?.adapterName || '')
    }

    for (let i = 1; i <= MAX_DISPLAYS; i++) {
      const display = this.state.remoteDisplays[i - 1]
      values[`display_${i}_summary`] = displaySummary(display)
      values[`display_${i}_device_name`] = String(display?.deviceName || '')
      values[`display_${i}_name`] = String(display?.name || '')
      values[`display_${i}_resolution`] = String(display?.resolution || '')
      values[`display_${i}_refresh_hz`] = formatInteger(display?.refreshHz)
      values[`display_${i}_scale_percent`] = formatNumber(display?.scalePercent, 0)
      values[`display_${i}_depth_bpp`] = formatInteger(display?.depthBpp)
      values[`display_${i}_rgb_range`] = String(display?.rgbRange || '')
      values[`display_${i}_hdr_text`] = String(display?.hdrText || '')
      values[`display_${i}_is_primary`] = display ? formatBool(!!display.isPrimary, 'yes', 'no') : ''
    }

    for (let i = 1; i <= MAX_DRIVES; i++) {
      const drive = driveToValues(this.state.remoteDrives[i - 1])
      values[`drive_${i}_summary`] = drive.summary
      values[`drive_${i}_letter`] = drive.letter
      values[`drive_${i}_type`] = drive.type
      values[`drive_${i}_total_gb`] = drive.totalGb
      values[`drive_${i}_free_gb`] = drive.freeGb
      values[`drive_${i}_used_gb`] = drive.usedGb
      values[`drive_${i}_free_percent`] = drive.freePercent
    }

    for (let i = 1; i <= MAX_LINKED_MACHINES; i++) {
      const machine = this.state.linkedMachines[i - 1]
      values[`linked_${i}_machine_id`] = String(machine?.machineId || '')
      values[`linked_${i}_name`] = String(machine?.hostName || '')
      values[`linked_${i}_online`] = machine ? formatBool(!!machine.isOnline, 'on', 'off') : ''
      values[`linked_${i}_ip`] = String(machine?.ip || '')
      values[`linked_${i}_status_port`] = machine ? formatInteger(machine.statusPort) : ''
      values[`linked_${i}_version`] = String(machine?.version || '')
      values[`linked_${i}_color_hex`] = String(machine?.machineColorHex || '')
      values[`linked_${i}_cpu_percent`] = machine ? formatNumber(machine.cpuPercent, 1) : ''
      values[`linked_${i}_ram_percent`] = machine ? formatNumber(machine.ramPercent, 1) : ''
      values[`linked_${i}_gpu_percent`] = machine ? formatNumber(machine.gpuPercent, 1) : ''
      values[`linked_${i}_vram_percent`] = machine ? formatNumber(machine.vramPercent, 1) : ''
      values[`linked_${i}_rtt_ms`] = machine && machine.linkRttMs != null ? formatInteger(machine.linkRttMs) : ''
      values[`linked_${i}_loss_percent`] = machine && machine.linkLossPercent != null ? formatInteger(machine.linkLossPercent) : ''
      values[`linked_${i}_perf_summary`] = machine
        ? `${machine.hostName}\nCPU ${formatNumber(machine.cpuPercent, 0)} RAM ${formatNumber(machine.ramPercent, 0)}\nGPU ${formatNumber(machine.gpuPercent, 0)} VR ${formatNumber(machine.vramPercent, 0)}`
        : ''
      values[`linked_${i}_link_summary`] = machine
        ? `${machine.hostName}\n${machine.ip || 'no ip'}:${formatInteger(machine.statusPort)}\nRTT ${machine.linkRttMs != null ? formatInteger(machine.linkRttMs) : '--'} LOSS ${machine.linkLossPercent != null ? formatInteger(machine.linkLossPercent) : '--'}`
        : ''
    }

    this.setVariableValues(values)
  }

  applyPatch(patch) {
    patch = patch || {}
    if (patch.transportState !== undefined) this.state.transportState = patch.transportState
    if (patch.timecodeSender !== undefined) this.state.timecodeSender = !!patch.timecodeSender
    if (patch.timecodeReceiver !== undefined) this.state.timecodeReceiver = !!patch.timecodeReceiver
    if (patch.midiSender !== undefined) this.state.midiSender = !!patch.midiSender
    if (patch.midiReceiver !== undefined) this.state.midiReceiver = !!patch.midiReceiver
    if (patch.currentPreset !== undefined) this.state.currentPreset = patch.currentPreset
    if (patch.ltcLevelDb !== undefined) this.state.ltcLevelDb = Number(patch.ltcLevelDb)
    if (patch.externalDelayFrames !== undefined) this.state.externalDelayFrames = Number(patch.externalDelayFrames)
    if (patch.generatorDelayFrames !== undefined) this.state.generatorDelayFrames = Number(patch.generatorDelayFrames)
    if (patch.deskLock !== undefined) this.state.deskLock = !!patch.deskLock
    if (patch.showMode !== undefined) this.state.showMode = !!patch.showMode
    if (patch.colors !== undefined) this.state.colors = [].concat(patch.colors)
    if (patch.lastSyncMode !== undefined) this.state.lastSyncMode = patch.lastSyncMode

    this.pushAllVariableValues()
    this.checkAllFeedbacks()
  }

  async sendAndTrack(path, args, patch) {
    args = args || []
    patch = patch || {}
    const host = String(this.config.host || '').trim()
    const port = this.config.port

    if (!host || !port) {
      this.updateStatus(InstanceStatus.BadConfig || 'bad_config', 'Host or port missing')
      throw new Error('Host or port missing in module config')
    }

    await this.osc.send(host, port, path, args)

    this.state.lastOscPath = path
    this.state.lastOscArgs = Array.isArray(args) ? args.join(', ') : ''
    this.state.lastOscAt = new Date().toISOString()

    this.applyPatch(patch)
    this.updateStatus(InstanceStatus.Ok || 'ok')
  }
}

runEntrypoint(VbsOverlayOscInstance, UpgradeScripts)
