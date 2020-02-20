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

  client.validationRequests
  .create({
    phoneNumber: event.phone
  })
  .then(function(validation_request) {
    response.setStatusCode(200);
    response.setBody({'verificationCode': validation_request.validationCode});
    callback(null, response)
  })
  .catch(function(error) {
    if (error.code === 21450) {
      response.setStatusCode(200)
    } else {
      response.setStatusCode(400);
    }
    response.setBody(error);
    callback(null, response);
  })
  .done();
};
