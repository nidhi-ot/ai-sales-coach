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

## Day 4 Semantic VAD Confirmation

Test date: 2026-06-17

Backend endpoint tested: `POST /api/v1/realtime/session`

Test page: `spike/vad-tuning.html`

Scenario tested: `cold_call`

## Why This Was Added

The Day 3 VAD test above measured `server_vad` settings.

The Week 2 voice plan later required semantic VAD for live calls because semantic VAD is better at understanding whether the rep is actually finished speaking instead of only reacting to silence.

This means the Day 3 `server_vad` result is still useful historical testing, but the current live-call configuration should use `semantic_vad`.

## Current Live-Call Configuration

The realtime session now uses:

```json
{
  "type": "semantic_vad",
  "eagerness": "medium"
}
```

This is configured in `backend/app/api/routes/realtime.py` inside the OpenAI Realtime session request.

## Pause Test

The rep spoke a sentence, paused for 2-3 seconds in the middle, then continued speaking.

Test phrase:

```text
Hi, I'm calling about AI Sales Coach because many sales teams struggle with coaching consistency...

Pause for 2-3 seconds.

...and I wanted to ask how your team currently handles rep training.
```

Expected behavior:

The AI should wait during the pause and should not interrupt before the rep finishes the full sentence.

Actual behavior:

Pass. The AI waited during the 2-3 second pause and did not interrupt before the rep finished speaking.

## Notes

During one test, the AI switched from English to Swedish mid-call. This appears related to language/persona instructions or transcription behavior, not VAD timing.

## Day 4 Final Status

Semantic VAD is confirmed for the live realtime session.

Current Week 2 recommendation:

```text
semantic_vad with eagerness=medium
```
