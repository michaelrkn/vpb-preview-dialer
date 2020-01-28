# VPB Preview Dialer

Turns Virtual Phone Bank into a preview dialer.

# Extension

background.html loads twilio.js, LogRocket (for error logging), and
background.js.

manifest.json registers the extension to load the appropriate
controls-*.js when a user visits a VPB. The controls-*.js files
interact with the user and the page, and communicate with
background.js. The simplest one to understand is controls-van.js.

When a user initiates a phone call, controls-*.js sends the "dial"
message to background.js, which runs the call() function, which runs
the setupConnection() function, which fetches a capability token from
the /capability-token endpoint function, which authenticates against
the ACCESS_CODE env var. If correct, it sets up capability token to
instruct the client to execute the TwiML app with the SID provided by
the TWIML_APP_SID env var. These env vars are set at
https://www.twilio.com/console/functions/configure.

One the call() function has the capability token, it runs the
prepareDial() function, which runs the dial() function, which runs
Twilio.Device.connect(), which establishes the WebRTC connection to
the Twilio voice servers and executes the TwiML app provided by the
capability token. That TwiML app is at
https://www.twilio.com/console/voice/twiml/apps/APa94c69b7d79344b09c6032b9af2a6bcd.
All it does is execute a callback to the specified request URL, which
is the function at the endpoint /client-voice.

This function makes the actual phone call to the phone number. Since
this is a test account, I've made it so that it is hard-coded to call
a test Google Voice phone number, 4153475723, and to time out after 1
second instead of 15.

## Development

### Extension
To install the extension for development go to chrome://extensions/, switch on Developer mode in the upper right corner, click Load Unpacked, and then point to the repo directory.

Every time you make changes to the code, you'll need to hit the little
refresh button on chrome://extensions/ for the extension. The only
thing about testing is that ideally, we don't actually want to submit
the "not home" result that will always happen; I think you can disable
submitting by commenting out controls-openvpb.js#16, which is
`nextContact.click();`.

## Twilio Local Setup
```
brew tap twilio/brew && brew install twilio
twilio plugins:install @twilio-labs/plugin-serverless

Then `npm start`. This will launch the functions in a local container.
Configure the extension as normal, then run `localStorage.setItem('twilioSubdomain', 'localhost')` from the console in the extension, and you should be able to hit the local functions from the local extension.

### Upgrading legacy functions
1. `cp .env-sample .env`

For each account:
1. Edit `.env` to have the correct information. The twilio deployer is aware of this file.
2. `npm run deploy` This should fully configure and deploy an environment. Make a note of the subdomain of the newly created domain, e.g. "vpb-preview-dialer-3049-public" in the following:
```
Deployment Details
Domain: vpb-preview-dialer-3049-public.twil.io
```
3. Modify `scripts/legacy-update.js` with the new subdomain. Then, manually add this file to the **old** functions for this account.
4. Twilio will have modified `.twilio-functions`. Copy the contents to a new file in `twilio-config` with a self explanatory name.

Once **all** accounts are updated, publish the new extension version:

`npm run build:ext` will create an extension artifact in "build/extension.zip"

Finally, commit the new `twilio-config` files.

#### Upgrade Notes

`.twilio-functions`: Stores metadata regarding the deploy. I beleive it is account specific which is why I'm suggesting clearing it out each time. The cli does accept a -config option, so with future interations we can perhaps have a deploy script which automatically selects the correct one from `twilio-config`. I'm not entirely clear what it is used for, but I suspect its absence would cause future deploys to spin up a new service, rather than updating the existing one.