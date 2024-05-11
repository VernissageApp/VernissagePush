const express = require("express");
const bodyParser = require("body-parser");
const PushNotifications = require("node-pushnotifications");

const secureKey = process.env.VPUSH_KEY ?? "YWRtaW5pc3RyYXRvcjptcGR3ZnU0aXJ3cGRzNDJrdG4z"
const secureKeyValue = "Basic " + secureKey
const app = express();

app.use(bodyParser.json());
app.use(function (_req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow.
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    );

    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "*");

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
});

// Schema of json object:
// ```json
// {
//     "vapidSubject": "",
//     "vapidPublicKey": "",
//     "vapidPrivateKey": "",
//     "endpoint": "",
//     "userAgentPublicKey": "",
//     "auth": "",
//     "title": "",
//     "body": "",
//     "icon": "",
//     "badgeCount": 0
// }
// ```
app.post("/send", async (req, res) => {
    // Get WebPush JSON object.
    const webPushData = req.body;
    console.log(webPushData);
  
    // Verify credentials
    if (req.headers.authorization !== secureKeyValue) {
        return res.status(401).send('Authentication required.') // Access denied.  
    } 

    // Create payload
    const payload = {
        notification: {
            title: webPushData.title,
            body: webPushData.body,
            icon: webPushData.icon,
            data: {
                badgeCount: webPushData.badgeCount ?? 0
            }
        }
    };

    // Create subscription.
    const subscription = {
        endpoint: webPushData.endpoint,
        keys: {
            p256dh: webPushData.userAgentPublicKey,
            auth: webPushData.auth
        }
    }

    const settings = {
        web: {
            vapidDetails: {
                subject: webPushData.vapidSubject,
                publicKey: webPushData.vapidPublicKey,
                privateKey: webPushData.vapidPrivateKey,
            },
            TTL: 2419200,
            contentEncoding: "aes128gcm",
            headers: {},
        },
        isAlwaysUseFCM: false,
    };

    // Create PushNotifications object with settings.
    const push = new PushNotifications(settings);

    // Send new WebPush.
    const sendResult = await push.send(subscription, payload);

    console.log(sendResult);
    res.send(sendResult);
    res.status(201).end();
});

app.get("/", async (_req, res) => {
    res.send("Server is up and running...");
    res.status(200).end();
});

const port = 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));