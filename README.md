# Vernissage Push

[![Node.js 20](https://img.shields.io/badge/Node.js-20-5FA04E.svg?style=flat)](https://nodejs.org/)
[![Platforms macOS | Linux | Windows](https://img.shields.io/badge/Platforms-macOS%20%7C%20Linux%20%7C%20Windows-lightgray.svg?style=flat)](https://nodejs.org/)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-mczachurski%2Fvernissage--push-2496ED?style=flat)](https://hub.docker.com/repository/docker/mczachurski/vernissage-push)

Small HTTP service used by **Vernissage** to send browser push notifications. It acts as a stateless bridge between the Vernissage backend and the browser push ecosystem supported by Apple, Google, Mozilla, and other Web Push providers.

The service receives a fully prepared push request from the main Vernissage server, converts it into the format expected by `node-pushnotifications`, and forwards it to the target browser push endpoint.

## Highlights

- Simple Express-based service with a single write endpoint: `POST /send`
- Stateless design: VAPID keys and browser subscription data are sent in every request
- Shared-secret authentication through the `Authorization` header
- Suitable for local development, Docker deployments, and Fly.io-style hosting

## Quick Links

- Project website: [joinvernissage.org](https://joinvernissage.org)
- Documentation: [docs.joinvernissage.org](https://docs.joinvernissage.org)
- API server: [VernissageServer](https://github.com/VernissageApp/VernissageServer)
- Web client: [VernissageWeb](https://github.com/VernissageApp/VernissageWeb)
- iOS client: [VernissageMobile](https://github.com/VernissageApp/VernissageMobile)

## How It Fits Into Vernissage

This service handles web push delivery for Vernissage when an instance needs to notify a browser that subscribed to push notifications.

Runtime flow:

1. A user enables web push notifications in the Vernissage web client.
2. The browser returns subscription details such as the push endpoint, `p256dh` key, and `auth` secret.
3. Vernissage Server stores those values and decides when a notification should be sent.
4. Vernissage Server calls this service with the notification content, subscription data, and VAPID credentials.
5. This service sends the push request to the external browser push provider and returns the delivery result to the caller.

Because the service is stateless, it does not store subscriptions, queue notifications, or manage user data. Those responsibilities stay in the main Vernissage backend.

## Architecture

The codebase is intentionally small:

- `server.js` - Express server, CORS headers, authentication, payload mapping, and push delivery
- `package.json` - runtime dependencies and start script
- `Dockerfile` - container build for production-style deployment
- `fly.toml` - Fly.io deployment configuration

At runtime the service does three things:

1. validates the shared secret from the `Authorization` header,
2. maps the incoming JSON body into a Web Push subscription and payload,
3. sends the notification with `node-pushnotifications`.

## Requirements

- Node.js 20 or newer
- npm
- a caller that can provide:
  - VAPID subject, public key, and private key
  - browser push subscription endpoint
  - browser subscription keys (`p256dh` and `auth`)

## Getting Started

Install dependencies:

```bash
$ npm install
```

Set the shared secret used to protect the endpoint:

```bash
$ export VPUSH_KEY=YourSuperSecretKey
```

Start the service:

```bash
$ npm start
```

The server listens on `http://localhost:3000`.

Health checks:

- `GET /`
- `GET /send`

Both endpoints return a simple `Server is up and running...` response.

## API

### Authentication

Every request to `POST /send` must include:

```http
Authorization: Basic YourSuperSecretKey
```

The value must match the `VPUSH_KEY` environment variable.

### Endpoint

```http
POST /send
Content-Type: application/json
```

Request body:

| Field | Required | Description |
| --- | --- | --- |
| `vapidSubject` | yes | Contact subject used in VAPID details |
| `vapidPublicKey` | yes | Public VAPID key |
| `vapidPrivateKey` | yes | Private VAPID key |
| `endpoint` | yes | Browser push endpoint URL |
| `userAgentPublicKey` | yes | Browser subscription `p256dh` key |
| `auth` | yes | Browser subscription auth secret |
| `title` | yes | Notification title |
| `body` | yes | Notification body |
| `icon` | no | Notification icon URL |
| `badgeCount` | no | Badge count added to `notification.data.badgeCount` |

Example request:

```bash
$ curl --location 'http://localhost:3000/send' \
  --header 'Authorization: Basic YourSuperSecretKey' \
  --header 'Content-Type: application/json' \
  --data '{
    "vapidSubject": "mailto:admin@example.com",
    "vapidPublicKey": "BF...",
    "vapidPrivateKey": "zD...",
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "userAgentPublicKey": "BC...",
    "auth": "abc123",
    "title": "New comment",
    "body": "Someone replied to your post.",
    "icon": "https://example.com/icon.png",
    "badgeCount": 3
  }'
```

Response behavior:

- `201 Created` when the push library reports success
- `401 Unauthorized` when the `Authorization` header does not match
- `424 Failed Dependency` when the upstream push delivery fails

## Development Notes

- The service is currently configured to listen on port `3000`.
- CORS is open to all origins.
- The service logs incoming push payloads and provider responses to stdout.
- VAPID keys are expected per request, not through global application configuration.

## Docker

Build the image locally:

```bash
$ docker build -t vernissage-push .
```

Run the container:

```bash
$ docker run --rm -p 3000:3000 \
  -e VPUSH_KEY=YourSuperSecretKey \
  vernissage-push
```

Production images are published to [Docker Hub](https://hub.docker.com/repository/docker/mczachurski/vernissage-push).

## Deployment

The repository includes [`fly.toml`](fly.toml) for Fly.io deployment. The container expects only one required runtime secret:

- `VPUSH_KEY` - shared secret used to authorize `POST /send`

In production, make sure this value is set explicitly and kept private.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
