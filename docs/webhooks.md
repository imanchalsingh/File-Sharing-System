# Webhooks Documentation

Webhooks allow you to receive real-time HTTP POST notifications when specific events occur within the file-sharing platform. This eliminates the need for constant polling and enables seamless integration with external automation tools like Zapier, Slack, Discord, and custom applications.

## Managing Webhooks

Webhooks can be created, updated, deleted, and monitored from your **Settings** dashboard.
Each webhook configuration requires:
- **Target URL**: The endpoint where POST requests will be sent. Must be a valid HTTP(S) URL.
- **Secret Key**: A secure token used to sign payloads. You should use this to verify that incoming requests are genuinely from the platform.
- **Event Subscriptions**: A list of events you wish to receive notifications for.

## Supported Events

The following events can be subscribed to:

| Event Name | Description |
|---|---|
| `file_shared` | Triggered when a file is shared (e.g. link is copied or shared via email). |
| `link_accessed` | Triggered when a public share link is viewed or accessed by an external user. |
| `download_completed` | Triggered when an external user successfully downloads a shared file. |
| `link_expired` | Triggered automatically when a share link passes its expiration date. |

## Delivery Mechanism and Retries

Events are delivered asynchronously via **HTTP POST**. 
If your server responds with a non-2xx HTTP status code (e.g., 500, 404, or times out), the delivery is considered failed.

Failed deliveries are automatically retried up to **3 times** using **exponential backoff** (starting at 5 seconds, doubling per retry). You can view the delivery status, HTTP status codes, and error messages for the last 100 delivery attempts in the webhook's delivery logs via the Webhook API or Settings dashboard.

## Payload Schema

The standard webhook payload sent in the body of the POST request looks like this:

```json
{
  "fileId": "65abcdef1234567890",
  "fileName": "example_document.pdf",
  "shareCount": 1,
  "source": "direct_copy"
}
```
*Note: The exact fields vary slightly based on the event type (e.g. `downloadCount` for downloads, `shareId` for expired links).*

## Security: Signature Verification

To ensure that the webhook payloads are not tampered with and genuinely originate from the platform, every request includes signature headers:

- `X-Webhook-Signature`: The HMAC-SHA256 signature of the payload.
- `X-Webhook-Timestamp`: The UNIX timestamp when the request was generated.
- `X-Webhook-Event`: The name of the event being delivered.

### How to verify signatures (Node.js Example)

```javascript
const crypto = require('crypto');

function verifyWebhook(req, secretKey) {
  const signatureHeader = req.headers['x-webhook-signature'];
  const timestampHeader = req.headers['x-webhook-timestamp'];
  const body = JSON.stringify(req.body);

  const dataToSign = `${timestampHeader}.${body}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('hex');

  return signatureHeader === expectedSignature;
}
```

If `verifyWebhook()` returns `false`, you should discard the payload and return an HTTP `401 Unauthorized` or `403 Forbidden` response.
