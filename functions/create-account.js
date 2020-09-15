exports.handler = function(context, event, callback) {
  const DATABASE_NAME = "vbp-preview-dialer";

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

  //TODO - to make things easy could just delete any records with these credentials before insert
  client.connect(err => {
    const collection = client.db(DATABASE_NAME).collection("accounts");
    var newAccountDocument = { campaignCode: campaignCode, accessCode: accessCode, accountSid: accountSid };
    collection.insertOne(newAccountDocument, function(err, results) {
      if (err) {
        console.log("Database error", JSON.stringify(err));
        callback("Database error", response);
        return;
      }

      console.log("1 document inserted");
      response.setBody("Account created");
      callback(null, response);
    });
    client.close();
  });
};
