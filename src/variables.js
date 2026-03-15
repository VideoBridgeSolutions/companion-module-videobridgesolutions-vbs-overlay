module.exports = function updateVariableDefinitions(self) {
  const definitions = [
    { variableId: 'transport_state', name: 'Timecode transport state (shadow)' },
    { variableId: 'transport_label', name: 'Timecode transport label (shadow)' },
    { variableId: 'timecode_sender', name: 'Timecode sender enabled (shadow)' },
    { variableId: 'timecode_receiver', name: 'Timecode receiver enabled (shadow)' },
    { variableId: 'midi_sender', name: 'MIDI sender enabled' },
    { variableId: 'midi_receiver', name: 'MIDI receiver enabled' },
    { variableId: 'current_preset', name: 'Current timecode preset index (shadow)' },
    { variableId: 'ltc_level_db', name: 'LTC level (dB)' },
    { variableId: 'external_delay_frames', name: 'External delay (frames)' },
    { variableId: 'generator_delay_frames', name: 'Generator delay (frames)' },
    { variableId: 'desk_lock', name: 'Desk Lock state' },
    { variableId: 'show_mode', name: 'Show Mode state' },
    { variableId: 'last_osc_path', name: 'Last OSC path sent' },
    { variableId: 'last_osc_args', name: 'Last OSC args sent' },
    { variableId: 'last_osc_at', name: 'Last OSC send timestamp' },
    { variableId: 'last_sync_mode', name: 'Last sync mode run' },

    { variableId: 'status_polling', name: 'Remote status polling state' },
    { variableId: 'status_host', name: 'Remote status host' },
    { variableId: 'status_port', name: 'Remote status port' },
    { variableId: 'status_poll_ms', name: 'Remote status poll interval (ms)' },
    { variableId: 'remote_online', name: 'Remote link online' },
    { variableId: 'remote_link_state', name: 'Remote link state' },
    { variableId: 'remote_link_rtt_ms', name: 'Remote link RTT (ms)' },
    { variableId: 'remote_last_poll_at', name: 'Remote last poll timestamp' },
    { variableId: 'remote_timestamp_utc', name: 'Remote snapshot timestamp UTC' },
    { variableId: 'remote_machine_id', name: 'Remote machine ID' },
    { variableId: 'remote_mac', name: 'Remote MAC address' },
    { variableId: 'remote_allow_vnc', name: 'Remote allow VNC' },
    { variableId: 'remote_hostname', name: 'Remote host name' },
    { variableId: 'remote_version', name: 'Remote VBS version' },
    { variableId: 'remote_lan_text', name: 'Remote LAN text' },
    { variableId: 'remote_cpu_name', name: 'Remote CPU name' },
    { variableId: 'remote_cpu_percent', name: 'Remote CPU percent' },
    { variableId: 'remote_ram_percent', name: 'Remote RAM percent' },
    { variableId: 'remote_ram_total_gb', name: 'Remote RAM total (GB)' },
    { variableId: 'remote_ram_used_gb', name: 'Remote RAM used (GB)' },
    { variableId: 'remote_ram_free_gb', name: 'Remote RAM free (GB)' },
    { variableId: 'remote_gpu_name', name: 'Remote GPU name' },
    { variableId: 'remote_gpu_percent', name: 'Remote GPU percent' },
    { variableId: 'remote_gpu_mem_percent', name: 'Remote GPU memory percent' },
    { variableId: 'remote_gpu_temp_c', name: 'Remote GPU temperature (C)' },
    { variableId: 'remote_uptime_ms', name: 'Remote uptime (ms)' },
    { variableId: 'remote_uptime_hms', name: 'Remote uptime (d hh:mm:ss)' },
    { variableId: 'remote_drives_count', name: 'Remote drive count' },
    { variableId: 'remote_networks_count', name: 'Remote network count' },
    { variableId: 'remote_other_networks_count', name: 'Remote other network count' },
    { variableId: 'remote_displays_count', name: 'Remote display count' },
    { variableId: 'remote_shared_drive_letters_csv', name: 'Remote shared drive letters CSV' },
    { variableId: 'remote_shared_drive_shares_csv', name: 'Remote shared drive shares CSV' },

    { variableId: 'linked_count', name: 'Linked machine count' },
    { variableId: 'linked_list', name: 'Linked machine list summary' },

    { variableId: 'tc_fps', name: 'Timecode FPS' },
    { variableId: 'tc_source_mode', name: 'Timecode source mode' },
    { variableId: 'tc_active_source', name: 'Timecode active source' },
    { variableId: 'tc_state_mode', name: 'Timecode state mode' },
    { variableId: 'tc_transport_state', name: 'Timecode transport state (live)' },
    { variableId: 'tc_sender_enabled', name: 'Timecode sender enabled (live)' },
    { variableId: 'tc_sender_active', name: 'Timecode sender active' },
    { variableId: 'tc_receiver_enabled', name: 'Timecode receiver enabled (live)' },
    { variableId: 'tc_receiver_active', name: 'Timecode receiver active' },
    { variableId: 'tc_artnet_input_active', name: 'Art-Net input active' },
    { variableId: 'tc_ltc_input_active', name: 'LTC input active' },
    { variableId: 'tc_ltc_output_enabled', name: 'LTC output enabled' },
    { variableId: 'tc_ltc_output_active', name: 'LTC output active' },

    { variableId: 'tc_received_frame', name: 'Received timecode frame' },
    { variableId: 'tc_received_text', name: 'Received timecode text' },
    { variableId: 'tc_received_source', name: 'Received timecode source' },
    { variableId: 'tc_received_utc', name: 'Received timecode UTC' },

    { variableId: 'tc_artnet_in_frame', name: 'Art-Net input frame' },
    { variableId: 'tc_artnet_in_text', name: 'Art-Net input text' },
    { variableId: 'tc_artnet_in_utc', name: 'Art-Net input UTC' },

    { variableId: 'tc_ltc_in_frame', name: 'LTC input frame' },
    { variableId: 'tc_ltc_in_text', name: 'LTC input text' },
    { variableId: 'tc_ltc_in_utc', name: 'LTC input UTC' },

    { variableId: 'tc_generated_frame', name: 'Generated timecode frame' },
    { variableId: 'tc_generated_text', name: 'Generated timecode text' },
    { variableId: 'tc_generator_running', name: 'Generator running' },
    { variableId: 'tc_generator_paused', name: 'Generator paused' },

    { variableId: 'tc_output_frame', name: 'Output timecode frame' },
    { variableId: 'tc_output_text', name: 'Output timecode text' },
    { variableId: 'tc_ltc_out_frame', name: 'LTC output frame' },
    { variableId: 'tc_ltc_out_text', name: 'LTC output text' },

    { variableId: 'tc_rx_packets_received', name: 'RX packets received' },
    { variableId: 'tc_rx_valid_packets', name: 'RX valid packets' },
    { variableId: 'tc_rx_invalid_packets', name: 'RX invalid packets' },
    { variableId: 'tc_tx_packets_sent', name: 'TX packets sent' },
    { variableId: 'tc_rx_last_source_ip', name: 'RX last source IP' },
    { variableId: 'tc_rx_last_source_endpoint', name: 'RX last source endpoint' },
    { variableId: 'tc_rx_last_decoded_text', name: 'RX last decoded text' },
    { variableId: 'tc_rx_last_packet_valid', name: 'RX last packet valid' },
    { variableId: 'tc_rx_last_packet_detail', name: 'RX last packet detail' },
    { variableId: 'tc_rx_bind_endpoint', name: 'RX bind endpoint' },
    { variableId: 'tc_rx_bind_mode', name: 'RX bind mode' },
    { variableId: 'tc_rx_local_interfaces', name: 'RX local interfaces' },
    { variableId: 'tc_rx_last_opcode_text', name: 'RX last opcode text' },
    { variableId: 'tc_rx_last_packet_size', name: 'RX last packet size' },
    { variableId: 'tc_rx_first_bytes_hex', name: 'RX first bytes hex' },
    { variableId: 'tc_rx_op_timecode_count', name: 'RX OpTimeCode count' },
    { variableId: 'tc_rx_op_pollreply_count', name: 'RX OpPollReply count' },
    { variableId: 'tc_rx_op_poll_count', name: 'RX OpPoll count' },
    { variableId: 'tc_rx_op_other_count', name: 'RX other opcode count' },
    { variableId: 'tc_tx_last_target', name: 'TX last target' },
    { variableId: 'tc_tx_targets_summary', name: 'TX targets summary' },
    { variableId: 'tc_tx_last_packet_text', name: 'TX last packet text' },
    { variableId: 'tc_preset_count', name: 'Timecode preset count' },
    { variableId: 'tc_preset_master_preroll_s', name: 'Timecode preset master preroll (s)' },
    { variableId: 'tc_preset_list', name: 'Timecode preset list summary' },
    { variableId: 'tc_current_preset_name', name: 'Current preset name' },
    { variableId: 'tc_current_preset_timecode', name: 'Current preset timecode' },
  ]

  for (let i = 1; i <= 10; i++) {
    definitions.push({ variableId: 'color_' + i, name: 'Color slot ' + i })
  }

  for (let i = 1; i <= 4; i++) {
    definitions.push({ variableId: `network_${i}_summary`, name: `Network ${i} summary` })
    definitions.push({ variableId: `network_${i}_name`, name: `Network ${i} name` })
    definitions.push({ variableId: `network_${i}_state`, name: `Network ${i} state` })
    definitions.push({ variableId: `network_${i}_address`, name: `Network ${i} address` })
    definitions.push({ variableId: `network_${i}_subnet_mask`, name: `Network ${i} subnet mask` })
    definitions.push({ variableId: `network_${i}_ip_mode`, name: `Network ${i} IP mode` })
    definitions.push({ variableId: `network_${i}_adapter_name`, name: `Network ${i} adapter name` })

    definitions.push({ variableId: `other_network_${i}_summary`, name: `Other network ${i} summary` })
    definitions.push({ variableId: `other_network_${i}_name`, name: `Other network ${i} name` })
    definitions.push({ variableId: `other_network_${i}_state`, name: `Other network ${i} state` })
    definitions.push({ variableId: `other_network_${i}_address`, name: `Other network ${i} address` })
    definitions.push({ variableId: `other_network_${i}_subnet_mask`, name: `Other network ${i} subnet mask` })
    definitions.push({ variableId: `other_network_${i}_ip_mode`, name: `Other network ${i} IP mode` })
    definitions.push({ variableId: `other_network_${i}_adapter_name`, name: `Other network ${i} adapter name` })
  }

  for (let i = 1; i <= 6; i++) {
    definitions.push({ variableId: `display_${i}_summary`, name: `Display ${i} summary` })
    definitions.push({ variableId: `display_${i}_device_name`, name: `Display ${i} device name` })
    definitions.push({ variableId: `display_${i}_name`, name: `Display ${i} name` })
    definitions.push({ variableId: `display_${i}_resolution`, name: `Display ${i} resolution` })
    definitions.push({ variableId: `display_${i}_refresh_hz`, name: `Display ${i} refresh (Hz)` })
    definitions.push({ variableId: `display_${i}_scale_percent`, name: `Display ${i} scale percent` })
    definitions.push({ variableId: `display_${i}_depth_bpp`, name: `Display ${i} bit depth` })
    definitions.push({ variableId: `display_${i}_rgb_range`, name: `Display ${i} RGB range` })
    definitions.push({ variableId: `display_${i}_hdr_text`, name: `Display ${i} HDR text` })
    definitions.push({ variableId: `display_${i}_is_primary`, name: `Display ${i} is primary` })
  }

  for (let i = 1; i <= 8; i++) {
    definitions.push({ variableId: `drive_${i}_summary`, name: `Drive ${i} summary` })
    definitions.push({ variableId: `drive_${i}_letter`, name: `Drive ${i} letter` })
    definitions.push({ variableId: `drive_${i}_type`, name: `Drive ${i} type` })
    definitions.push({ variableId: `drive_${i}_total_gb`, name: `Drive ${i} total (GB)` })
    definitions.push({ variableId: `drive_${i}_free_gb`, name: `Drive ${i} free (GB)` })
    definitions.push({ variableId: `drive_${i}_used_gb`, name: `Drive ${i} used (GB)` })
    definitions.push({ variableId: `drive_${i}_free_percent`, name: `Drive ${i} free percent` })
  }

  const tcCounters = [
    ['received', 'Received'],
    ['artnet_in', 'Art-Net input'],
    ['ltc_in', 'LTC input'],
    ['generated', 'Generated'],
    ['output', 'Output'],
    ['ltc_out', 'LTC output'],
  ]
  for (const [id, label] of tcCounters) {
    definitions.push({ variableId: `tc_${id}_hh`, name: `${label} hours` })
    definitions.push({ variableId: `tc_${id}_mm`, name: `${label} minutes` })
    definitions.push({ variableId: `tc_${id}_ss`, name: `${label} seconds` })
    definitions.push({ variableId: `tc_${id}_ff`, name: `${label} frames` })
  }

  for (let i = 1; i <= 8; i++) {
    definitions.push({ variableId: `linked_${i}_machine_id`, name: `Linked machine ${i} ID` })
    definitions.push({ variableId: `linked_${i}_name`, name: `Linked machine ${i} name` })
    definitions.push({ variableId: `linked_${i}_online`, name: `Linked machine ${i} online` })
    definitions.push({ variableId: `linked_${i}_ip`, name: `Linked machine ${i} IP` })
    definitions.push({ variableId: `linked_${i}_status_port`, name: `Linked machine ${i} status port` })
    definitions.push({ variableId: `linked_${i}_version`, name: `Linked machine ${i} version` })
    definitions.push({ variableId: `linked_${i}_color_hex`, name: `Linked machine ${i} color hex` })
    definitions.push({ variableId: `linked_${i}_cpu_percent`, name: `Linked machine ${i} CPU percent` })
    definitions.push({ variableId: `linked_${i}_ram_percent`, name: `Linked machine ${i} RAM percent` })
    definitions.push({ variableId: `linked_${i}_gpu_percent`, name: `Linked machine ${i} GPU percent` })
    definitions.push({ variableId: `linked_${i}_vram_percent`, name: `Linked machine ${i} VRAM percent` })
    definitions.push({ variableId: `linked_${i}_rtt_ms`, name: `Linked machine ${i} RTT ms` })
    definitions.push({ variableId: `linked_${i}_loss_percent`, name: `Linked machine ${i} loss percent` })
    definitions.push({ variableId: `linked_${i}_perf_summary`, name: `Linked machine ${i} performance summary` })
    definitions.push({ variableId: `linked_${i}_link_summary`, name: `Linked machine ${i} link summary` })
  }

  self.setVariableDefinitions(definitions)
}
