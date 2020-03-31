# VPB Preview Dialer

Turns Virtual Phone Bank into a preview dialer.

## Backend

The backend of the app is powered by [Twilio Functions](https://www.twilio.com/docs/runtime/functions).

To develop on the backend, [install Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart).

To add a new account, create a new account from the Twilio dashboard, generate an API key, and create a TwiML app.

Then, copy `.env.example`, replace `example` with the account's name, and fill in the variables.

To deploy, run:

```
twilio serverless:deploy \
--production --override-existing-project \
--env=.env.example -n example && \
rm .twilio-functions
```

where `example` is the account's name. Repeat this for each account.

## Frontend

The frontend of the app is a Chrome extension.

To install the extension for development go to `chrome://extensions/`,
switch on Developer mode in the upper right corner, click Load Unpacked,
and then point to the `extension` directory.

Every time you make changes to the code, you'll need to hit the little
refresh button on `chrome://extensions/` for the extension.

In development, after the extension selects "Not Home", it will not submit.

To deploy the extension, zip the `extension` folder and upload it
[here](https://chrome.google.com/webstore/devconsole/3793eb02-7d7f-4e75-a980-ad36fefad9da/dkcikjbkeekejknjicohkaidadbjcdee/edit/package).

## Architecture

`background.html` loads `twilio.js`, Sentry (for error logging),
and `background.js`.

`manifest.json` registers the extension to load the appropriate
`controls-*.js` when a user visits a VPB. The `controls-*.js` files
interact with the user and the page, and communicate with
`background.js`. The simplest one to understand is `controls-van.js`.

When a user initiates a phone call, `controls-*.js` sends the `dial`
message to `background.js`, which runs the `call()` function, which runs
the `setupConnection()` function, which fetches an access token from
the `/access-token` endpoint function, which authenticates against
the `ACCESS_CODE` env var. If correct, it sets up an access token to
instruct the client to execute the TwiML app with the SID provided by
the `TWIML_APP_SID` env var.

Once the `call()` function has the access token, it runs the
`prepareDial()` function, which runs the `dial()` function, which runs
`Twilio.Device.connect()`, which establishes the WebRTC connection to
the Twilio voice servers and executes the TwiML app provided by the
capability token.

The TwiML app executes a callback to the specified request URL,
which is the function at the endpoint `/client-voice`. This function
makes the actual phone call to the phone number.
