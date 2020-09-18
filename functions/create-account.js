exports.handler = function(context, event, callback) {
  const DATABASE_NAME = "vbp-preview-dialer";
  const COLLECTION_NAME = "accounts";

  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };

  response.setHeaders(headers);
  response.setStatusCode(200);

  let accountSid = event.AccountSid;
  if (accountSid == null || event.state == null){
    console.log(event);
    callback("Missing required paramaters", response);
    return;
  }

  let state = JSON.parse(event.state);
  let campaignCode = state.userCampaignCode;
  let accessCode = state.userAccessCode;

  if (campaignCode == null || accessCode == null) {
    console.log(state);
    callback("Missing required state paramaters", response);
    return;
  }

  const MongoClient = require('mongodb').MongoClient;
  const uri = "mongodb+srv://" + context.MONGODB_USER +  ":" + context.MONGODB_PASSWORD + "@cluster0.musam.mongodb.net/" + DATABASE_NAME + "?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true
  });

  var accountDocument = { campaignCode: campaignCode, accessCode: accessCode, accountSid: accountSid };

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
    const collections = client.db(DATABASE_NAME).collection(COLLECTION_NAME);
    return collections.findOne(accountDocument);
  })
  .then(results => {
      if (results == null) {
        const authToken = context.AUTH_TOKEN;
        const twilioClient = require('twilio')(accountDocument.accountSid, authToken);
        return twilioClient.applications
          .create({
             voiceMethod: 'POST',
             voiceUrl: 'https://vpb-dialer-5062.twil.io/client-voice',
             friendlyName: 'VBP Preview Dialer'
           });
      }
      return results;
    })
    .then(results => {
      console.log("account", JSON.stringify(results));
      //Kind of hacky, is there a better way?
      if (results.campaignCode == null) {
        accountDocument.twimlSid = results.sid;
        const collections = client.db(DATABASE_NAME).collection(COLLECTION_NAME);
        return collections.insertOne(accountDocument);
      }
      return results;
    })
    .then(accountRecord => {
      console.log(JSON.stringify(accountRecord));
      //TODO put in some html asset to redirect to or just include in the response
      response.setBody("You've successfully created an account!  Please close this window and return to options.");
      client.close();
      callback(null, response);
    })
    .catch(error => {
      client.close();
      console.log(JSON.stringify(error));
      callback("There was an error creating your account, please try again or contact us", response);
    });
};
