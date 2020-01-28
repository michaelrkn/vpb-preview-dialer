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
        
        let ClientCapability = require('twilio').jwt.ClientCapability;
        const capability = new ClientCapability({
          accountSid: context.ACCOUNT_SID,
          authToken: context.AUTH_TOKEN
        });
        capability.addScope(new ClientCapability.OutgoingClientScope({
          applicationSid: context.TWIML_APP_SID
        }));
        
      
        response.setBody({
          'token': capability.toJwt()
        });
    } else {
        response.setStatusCode(401);
    }
    
    callback(null, response);
  };