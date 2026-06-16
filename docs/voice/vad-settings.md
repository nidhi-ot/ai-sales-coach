# VAD Settings Validation

Test date: 2026-06-15

Test page: `spike/vad-tuning.html`

Backend endpoint tested: `POST /api/v1/realtime/session`

Scenario tested: `cold_call`

Persona: busy facility manager / cold call customer

## What Was Tested

This test compares three Voice Activity Detection (VAD) settings for the OpenAI Realtime WebRTC sales coaching flow.

VAD controls when the AI decides the human speaker has stopped talking and when the AI should respond.

A false positive means the AI responds too early or interrupts while the user is still thinking or speaking.

A false negative means the AI waits too long after the user has finished speaking.

For this spike, the backend used `server_vad` because `threshold` and `silence_duration_ms` are supported with that VAD type.

## Test Method

The backend was started locally and the WebRTC spike page was opened in the browser.

Each VAD configuration was tested with the `cold_call` persona.

The test phrase used was:

```text
Hi, I'm calling about your cleaning services.
```

A longer sentence was also tested:

```text
We work with several property managers in Stockholm...

Pause briefly.

...and I wanted to ask about your current cleaning provider.
```

During each test, the timing of the AI response was observed and marked as:

- Good Turn: the AI responded at a comfortable time.
- False Positive: the AI responded too early or interrupted.
- False Negative: the AI waited too long after the user stopped speaking.

## Configurations Tested

Default:

```json
{
  "type": "server_vad",
  "threshold": 0.5,
  "silence_duration_ms": 500
}
```

Sensitive:

```json
{
  "type": "server_vad",
  "threshold": 0.3,
  "silence_duration_ms": 200
}
```

Conservative:

```json
{
  "type": "server_vad",
  "threshold": 0.7,
  "silence_duration_ms": 800
}
```

## Results

Default (threshold=0.5, silence_duration_ms=500):

AI occasionally treated short thinking pauses as the end of the turn and responded too early.

Result: some false positives.

Sensitive (threshold=0.3, silence_duration_ms=200):

Most natural conversation flow. The AI allowed short pauses while thinking without interrupting. Response timing felt balanced.

Result: best setting.

Conservative (threshold=0.7, silence_duration_ms=800):

The AI waited longer before handing the turn back. The conversation felt slower and less responsive.

Result: slower turn-taking / possible false negatives.

## Recommendation

Use the Sensitive VAD setting for the current WebRTC sales coaching spike.

Recommended configuration:

```json
{
  "type": "server_vad",
  "threshold": 0.3,
  "silence_duration_ms": 200
}
```

## Evidence

The test was performed manually in `spike/vad-tuning.html`.

The page records:

- Selected VAD configuration
- False positive count
- False negative count
- Good turn count
- Tester notes
- Downloadable test log

## Notes

This result is based on manual WebRTC testing in the spike page. The Sensitive setting should be used as the starting point in the real frontend, but it may need to be retested with more users, different microphones, background noise, and different speaking styles.

## Final Status

Task 3.1 VAD tuning is complete for the spike.

The recommended setting is:

```text
Sensitive: threshold=0.3, silence_duration_ms=200
```
