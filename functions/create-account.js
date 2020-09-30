exports.handler = function(context, event, callback) {

  class AccountExistsError extends Error { }

  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };

  //TODO probably can just get the service address somehow
  const BASE_URL = "vpb-dialer-5062";

  response.setHeaders(headers);
  response.setStatusCode(200);

  let accountSid = event.accountSid;
  let authToken = event.authToken;
  let campaignCode = event.campaignCode;
  let accessCode = event.accessCode;
  let email = event.email;

  if (accountSid == null || authToken == null || campaignCode == null || accessCode == null || email == null ){
    console.log(event);
    callback("Missing required paramaters", response);
    return;
  }

  const MongoClient = require('mongodb').MongoClient;
  const uri = "mongodb+srv://" + context.MONGODB_USER +  ":" + context.MONGODB_PASSWORD + "@cluster0.musam.mongodb.net/" + context.MONGODB_DATABASE_NAME + "?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true
  });

  var accountLookupDocument = { campaignCode: campaignCode, accessCode: accessCode };

  const connectDbClientPromise = () => {
    return new Promise((resolve, reject) => {
      client.connect(error => {
        if (error) {
          console.log("Error on database client connect", JSON.stringify(error));
          return reject("Database Error");
        } else {
          resolve(null);
        }
      });
    })
  };

  connectDbClientPromise()
  .then(function() {
    console.log("db lookup");
    const collections = client.db(context.MONGODB_DATABASE_NAME).collection(context.MONGODDB_COLLECTION_NAME);
    return collections.findOne(accountLookupDocument);
  })
  .then(results => {
    if (results == null) {
      const twilioClient = require('twilio')(accountSid, authToken);
      return twilioClient.applications
        .create({
           voiceMethod: 'POST',
           voiceUrl: 'https://' + BASE_URL +  '.twil.io/client-voice',
           friendlyName: 'VPB Preview Dialer'
         });
      } else {
        throw new AccountExistsError("Please use a different campaign code and access code.");
      }
    })
    .then(results => {
      if (results.campaignCode == null) {
        const collections = client.db(context.MONGODB_DATABASE_NAME).collection(context.MONGODDB_COLLECTION_NAME);
        return collections.insertOne({
          campaignCode: campaignCode,
          accessCode: accessCode,
          accountSid: accountSid,
          authToken: authToken,
          twimlSid: results.sid,
          email: email
        });
      }
      return results;
    })
    .then(accountRecord => {
      response.setBody({ message: "You've successfully created an account!  Make sure you don't forget your campaign and access codes, then close this window and return to the Options screen to finish setup." });
      client.close();
      callback(null, response);
    })
    .catch(error => {
      console.log(error);
      client.close();
      if (error instanceof AccountExistsError) {
        response.setBody({ message: error.message });
        callback(null, response);
      } else {
        callback("There was an error creating your account. Please try again.", response);
      }
    });
};
