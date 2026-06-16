# Browser Compatibility Test Results

Test date: 2026-06-16

Test page: `spike/vad-tuning.html`

Backend endpoint tested: `POST /api/v1/realtime/session`

Scenario tested: `cold_call`

VAD setting used: Sensitive (`threshold=0.3`, `silence_duration_ms=200`)

## What Was Tested

This test checks whether the WebRTC voice spike works across major browsers.

Each browser should support:

- Microphone access
- WebRTC connection
- Data channel functionality
- AI audio playback
- Manual session end

## Results

<table>
  <thead>
    <tr>
      <th>Browser</th>
      <th>Version</th>
      <th>Microphone</th>
      <th>WebRTC</th>
      <th>Data Channel</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Chrome</td>
      <td>Local</td>
      <td>✓</td>
      <td>✓</td>
      <td>✓</td>
      <td>Works</td>
    </tr>
    <tr>
      <td>Firefox</td>
      <td>115+</td>
      <td>Not tested</td>
      <td>Not tested</td>
      <td>Not tested</td>
      <td>Browser unavailable locally</td>
    </tr>
    <tr>
      <td>Safari</td>
      <td>Local</td>
      <td>✓</td>
      <td>✓</td>
      <td>✓</td>
      <td>Permission prompt strict</td>
    </tr>
    <tr>
      <td>Edge</td>
      <td>Latest</td>
      <td>Not tested</td>
      <td>Not tested</td>
      <td>Not tested</td>
      <td>Browser unavailable locally</td>
    </tr>
  </tbody>
</table>

## Safari Notes

Safari worked in local testing. No Safari-specific code changes were required for this spike.

Safari may still need extra attention in future production testing because it can be stricter about microphone permissions and media autoplay.

## Final Status

Chrome and Safari passed local compatibility testing.

Firefox and Edge were not tested because they were not available on the tester machine.
