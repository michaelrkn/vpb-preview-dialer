# VPB Preview Dialer

Turns Virtual Phone Bank into a preview dialer.

## Twilio Functions

Install Twilio CLI with `brew install twilio`.

To add a new account, copy `.env.example`, replace `example` with the
account's name/campaign code, and fill in the variables.

To deploy updated code, run:

```
twilio serverless:deploy \
--production --override-existing-project \
--env=.env.example -n example && \
rm .twilio-functions
```

where `example` is the account's name. Repeat this for each account.
