# Barge-In Test Results

Test date: 2026-06-16

Test page: `spike/vad-tuning.html`

Backend endpoint tested: `POST /api/v1/realtime/session`

Scenario tested: `cold_call`

VAD setting used:

```json
{
  "type": "server_vad",
  "threshold": 0.3,
  "silence_duration_ms": 200
}
```

## What Was Tested

Barge-in behavior means the sales rep can interrupt the AI while the AI is speaking.

The expected behavior is:

- The AI stops speaking quickly.
- The user's interruption is heard.
- The AI responds to the new topic instead of continuing the old sentence.
- Multiple interruptions can be handled without confusion.

## Test Case 1: Mid-Sentence Interrupt

AI was saying:

```text
Actually the biggest hesitation is the price...
```

Rep interrupted with:

```text
Actually, let me ask you about price first.
```

Result:

- AI stopped: yes
- AI heard/responded to price: yes

Pass/fail: Pass

## Test Case 2: Quick Follow-Up

AI was saying:

```text
Yes...
```

Rep interrupted with:

```text
What if I could save you 20 percent?
```

Result:

- AI stopped: yes
- AI heard/responded to savings: yes

Pass/fail: Pass

## Test Case 3: Multiple Interruptions In Succession

Interruption 1 result:

```text
Cheap price is good but...
```

Interruption 2 result:

```text
I don't want to end up in long contract length...
```

Interruption 3 result:

```text
Yes, not the first priority...
```

Result:

- AI stopped each time: yes
- AI understood each new topic: yes

Pass/fail: Pass

## Summary

Barge-in behavior worked successfully in the WebRTC spike.

The AI stopped when interrupted, heard the sales rep's new input, and responded to the new topic.

Multiple interruptions in succession were handled without confusion.

## Final Status

Task 3.2 Barge-In Testing is complete.
