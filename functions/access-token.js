exports.handler = function(context, event, callback) {
  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };
  response.setHeaders(headers);

  if (event.accessCode === context.ACCESS_CODE) {
    response.setStatusCode(200);

    const AccessToken = require('twilio').jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const accountSid = context.ACCOUNT_SID;
    const apiKey = context.API_KEY;
    const apiSecret = context.API_SECRET;
    const outgoingApplicationSid = context.TWIML_APP_SID;

    const token = new AccessToken(accountSid, apiKey, apiSecret);
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid
    });
    token.addGrant(voiceGrant);

    response.setBody({
      'token': token.toJwt()
    });
  } else {
    response.setStatusCode(401);
  }

  callback(null, response);
};
