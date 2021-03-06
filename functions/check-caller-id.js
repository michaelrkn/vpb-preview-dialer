exports.handler = function(context, event, callback) {
  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };

  response.setHeaders(headers);

  const accessCode = event.accessCode;
  const campaignCode = event.campaignCode;

  if (campaignCode == null || accessCode == null){
    console.log(event);
    callback("Missing required paramaters", response);
    return;
  }

  const MongoClient = require('mongodb').MongoClient;
  const uri = "mongodb+srv://" + context.MONGODB_USER +  ":" + context.MONGODB_PASSWORD + "@cluster0.musam.mongodb.net/" + context.MONGODB_DATABASE_NAME + "?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true
  });

  const connectDbClientPromise = () => {
    return new Promise((resolve, reject) => {
      client.connect(error => {
        if (error) {
          console.log("Error on database client connect", JSON.stringify(error));
          return reject(error);
        } else {
          resolve(null);
        }
      });
    })
  };

  var accountDocument = { campaignCode: campaignCode, accessCode: accessCode };
  connectDbClientPromise()
  .then(() => {
    console.log("db connection established");
    const collections = client.db(context.MONGODB_DATABASE_NAME).collection(context.MONGODDB_COLLECTION_NAME);
    return collections.findOne(accountDocument);
  })
  .then(account => {
    if (account == null) {
      throw new Error("account doesn't exist");
    }

    const accountSid = account.accountSid;
    const authToken = account.authToken;
    const twilioClient = require('twilio')(accountSid, authToken);

    twilioClient.outgoingCallerIds
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
  });
}
