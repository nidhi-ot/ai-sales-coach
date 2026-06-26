# Contracts

This document defines the frozen interface contracts for the initial implementation.

## Versioning Rules

- Current version: `v1`
- Contract changes must be additive after agreement
- Breaking changes require a new versioned contract path

## Authentication

### `POST /api/v1/auth/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

Response `200`:

```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user_id": "uuid"
}
```

### `POST /api/v1/auth/logout`

Response `200`:

```json
{
  "message": "Logged out"
}
```

## Sessions

### `GET /api/v1/sessions`

Response `200`:

```json
{
  "sessions": []
}
```

### `POST /api/v1/sessions`

Request body:

```json
{
  "title": "Discovery Call",
  "prospect_name": "string"
}
```

Response `201`:

```json
{
  "session_id": "uuid",
  "status": "created"
}
```

## Agent

### `POST /api/v1/agent/before-call`

Assembles the system instruction for the AI customer before a live practice call starts.

Request body:

```json
{
  "rep_id": "uuid",
  "business_id": "uuid",
  "scenario": "cold_call"
}
```

Allowed `scenario` values:

- `cold_call`
- `hot_call`
- `directsales`
- `meeting`

Response `200`:

```json
{
  "rep_id": "uuid",
  "business_id": "uuid",
  "scenario": {
    "scenario": "cold_call",
    "title": "Cold Call",
    "objective": "string",
    "success_conditions": []
  },
  "profile_version": 1,
  "weakest_dimension": "objection_handling",
  "framework": "BANT",
  "metric_scores": {},
  "system_instruction": "string"
}
```

## Realtime

### `GET /api/v1/realtime/status`

Response `200`:

```json
{
  "message": "Realtime route placeholder"
}
```

### Planned event names

- `session.started`
- `session.updated`
- `session.ended`
- `coach.feedback.generated`

## Error Envelope

All non-2xx responses should converge on:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```
