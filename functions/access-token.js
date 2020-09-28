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
    const outgoingApplicationSid = account.twimlSid;
    const authToken = account.authToken;

    let ClientCapability = require('twilio').jwt.ClientCapability;
    const capability = new ClientCapability({
      accountSid: accountSid,
      authToken: authToken
    });

    capability.addScope(new ClientCapability.OutgoingClientScope({
      applicationSid: outgoingApplicationSid
    }));

    response.setBody({
      'token': capability.toJwt()
    });
    response.setStatusCode(200);

    callback(null, response);

  })
  .catch(error => {
    response.setStatusCode(401);
    console.log("Error fetching access token", JSON.stringify(error));
    callback(new Error("There was an issue finding your account"), null);
  });

};
