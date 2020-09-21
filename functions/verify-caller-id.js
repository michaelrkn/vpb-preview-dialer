exports.handler = function(context, event, callback) {
  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };
  response.setHeaders(headers);

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

  var accountDocument = { campaignCode: event.campaignCode, accessCode: event.accessCode };
  connectDbClientPromise()
  .then(() => {
    console.log("db connection established");
    const collections = client.db(context.MONGODB_DATABASE_NAME).collection(context.MONGODDB_COLLECTION_NAME);
    return collections.findOne(accountDocument);
  })
  .then(account => {
    console.log("account", account);
    if (account == null) {
      throw new Error("account doesn't exist");
    }

    const accountSid = account.accountSid;
    const authToken = context.AUTH_TOKEN;
    const twilioClient = require('twilio')(accountSid, authToken);

    return twilioClient.validationRequests.create({
        phoneNumber: event.phone
    });
  })
  .then(validation_request => {
    response.setStatusCode(200);
    response.setBody({'verificationCode': validation_request.validationCode});
    callback(null, response)
  })
  .catch(error => {
    if (error.code === 21450) {
      response.setStatusCode(200)
    } else {
      response.setStatusCode(400);
    }
    response.setBody(error);
    callback(null, response);
  });
};
