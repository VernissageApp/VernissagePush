# Vernissage Push

[![NodeJS](https://img.shields.io/badge/NodeJS-Latest-blue.svg?style=flat)](https://nodejs.org/)
[![Platforms macOS | Linux | Windows](https://img.shields.io/badge/Platforms-macOS%20%7C%20Linux%20%7C%20Windows%20-lightgray.svg?style=flat)](https://nodejs.org/)

The application is used to send push notifications from the Vernissage platform. 

The application serves one endpoint:

```
POST https://example.url/send
```

You can send the JSON in format:
```json
{
    "vapidSubject": "",
    "vapidPublicKey": "",
    "vapidPrivateKey": "",
    "endpoint": "",
    "userAgentPublicKey": "",
    "auth": "",
    "title": "",
    "body": "",
    "icon": ""
}
```

Thus you have to specify Vapid keys and also user public key and secret from the browser.
Before using application you have to set up one environment variable, eg:

```
$ export VPUSH_KEY=YourSuperSecretKey
```

Each request to the API have to contains header:

```
Authorization: Basic YourSuperSecretKey
```

## Docker

In production environments, it is best to use a [docker image](https://hub.docker.com/repository/docker/mczachurski/vernissage-push).