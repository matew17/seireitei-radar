# Assign Threat Alert Contract

## Request

`POST /threat-alerts/{id}/assign`

- Path parameter `id`: UUID threat-alert identity.
- Request body: none.

## Success Response

`200 OK`

Returns the established threat-alert representation with:

- `status`: `ASSIGNED`
- `squadId`: the selected eligible squad identity

The response retains `id`, `threatLevel`, `latitude`, `longitude`, and `createdAt`. It does not add `candidateSquads`.

## Error Responses

| Condition | Status | Error code | Safe message |
|-----------|--------|------------|--------------|
| Alert does not exist | 404 | `NOT_FOUND` | `ThreatAlert not found` |
| Alert is assigned or resolved | 409 | `CONFLICT` | `ThreatAlert is not pending and unassigned` |
| No eligible squad exists | 409 | `CONFLICT` | `No eligible squad available` |
| Invalid alert identity | 400 | `VALIDATION_ERROR` | DTO validation message |

All error responses use the existing global domain-exception response shape and exclude database details.
