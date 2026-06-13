# Chunked upload architecture

This project uses **authenticated, resumable chunked uploads** for reliable large file transfers.

## Overview

```
Client (MyFiles)                Server (Express)                 Storage
     |                                |                              |
     |-- POST /api/files/upload/init ->| Create UploadSession (Mongo) |
     |<- sessionId, chunk config -------|                              |
     |                                |                              |
     |-- POST /api/files/upload/chunk ->| Write chunk to temp disk     |
     |   (repeat per chunk)           | Track received chunk indices |
     |                                |                              |
     |<- progress / fileUrl ------------| Assemble + stream to Cloudinary
     |                                |                              |
     |-- POST /api/files/save-info --->| Save metadata (MongoDB)      |
```

## Features

- **5 MB chunks** (configurable via `UPLOAD_CHUNK_SIZE_BYTES`)
- **Resumable uploads** — interrupted sessions continue from the last successful chunk
- **Pause / resume** — client-side pause without losing server progress
- **Retry logic** — up to 3 retries per chunk with exponential backoff
- **Incremental SHA-256** — memory-efficient checksum during upload
- **Session expiration** — stale sessions cleaned after 24 hours (configurable)
- **Integrity validation** — assembled file size + checksum verified before Cloudinary upload

## Supported file sizes

Default maximum: **5 GB** (`MAX_FILE_SIZE_BYTES`). Adjust in server `.env`.

Cloudinary plan limits still apply for the final stored asset.

## API specification

### `POST /api/files/upload/init`

**Auth:** Required (JWT cookie or Bearer token)

**Body:**
```json
{
  "fileName": "video.mp4",
  "fileSizeBytes": 1073741824,
  "mimeType": "video/mp4",
  "expectedChecksum": "abc123...",
  "sessionId": "optional-for-resume"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "...",
    "uploadId": "...",
    "totalChunks": 205,
    "chunkSizeBytes": 5242880,
    "receivedChunks": [],
    "uploadedBytes": 0,
    "status": "uploading",
    "progressPercent": 0
  }
}
```

### `POST /api/files/upload/chunk`

**Auth:** Required

**Multipart fields:**
- `sessionId` — MongoDB session ID
- `chunkIndex` — zero-based chunk index
- `chunk` — binary chunk data

**Response:** Session progress or final `fileUrl` when complete.

### `GET /api/files/upload/status/:sessionId`

Returns current session state for resume operations.

### `GET /api/files/upload/resumable`

Lists the user's active resumable sessions.

### `DELETE /api/files/upload/:sessionId`

Cancels a session and removes temporary chunk files.

## Client workflow

1. User selects file(s) in **My Files**.
2. Client computes incremental SHA-256 in 5 MB passes.
3. Client calls `upload/init`, then uploads missing chunks sequentially.
4. On network failure, session is stored in `localStorage`.
5. User clicks **Resume** in the interrupted uploads banner and re-selects the same file.
6. After Cloudinary URL is returned, client calls existing `save-info` endpoint.

## Environment variables

```env
MAX_FILE_SIZE_BYTES=5368709120
UPLOAD_CHUNK_SIZE_BYTES=5242880
UPLOAD_SESSION_TTL_HOURS=24
UPLOAD_TEMP_DIR=./uploads/temp
CLOUDINARY_UPLOAD_FOLDER=myfiles
```

## Testing

**Server unit tests:**
```bash
cd server
npm test
```

**Client unit tests:**
```bash
cd client
npm test
```

**Manual large-file test:**
1. Start server and client.
2. Upload a file > 50 MB.
3. Throttle network in DevTools and pause/resume.
4. Refresh page and resume from the interrupted uploads banner.

## Extending the system

- **Parallel chunk uploads:** increase throughput by uploading batch N..N+k; ensure server idempotency (already supports duplicate chunk indices).
- **Direct-to-Cloudinary chunks:** move chunk POSTs to Cloudinary signed URLs to reduce server bandwidth.
- **Cross-device resume:** persist `File` handle via File System Access API or re-upload from user-selected file (current approach).

## Deprecated endpoint

`POST /upload` is deprecated. Use `/api/files/upload/init` instead.
