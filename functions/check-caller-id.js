exports.handler = function(context, event, callback) {
  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };
  response.setHeaders(headers);

  const accountSid = context.ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  client.outgoingCallerIds
  .list({
    phoneNumber: event.phone
  })
  .then(function(caller_id) {
    response.setStatusCode(200);
    if (caller_id.length === 1) {
      response.setBody({'verified': true});
    } else {
      response.setBody({'verified': false});
    }
    callback(null, response)
  })
  .done();
};
