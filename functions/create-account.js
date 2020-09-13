exports.handler = function(context, event, callback) {

  let response = new Twilio.Response();
  let headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
  };
  response.setHeaders(headers);
  response.setStatusCode(200);

  const MongoClient = require('mongodb').MongoClient;

  const uri = "mongodb+srv://" + context.MONGODB_USER +  ":" + context.MONGODB_PASSWORD + "@cluster0.musam.mongodb.net/" + "sample_airbnb" + "?retryWrites=true&w=majority";


  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(err => {
    const collection = client.db("sample_airbnb").collection("listingsAndReviews");
    let stringBuilder = "";
    collection.find({room_type: "Entire home/apt" }).limit(20).toArray(function(err, results) {
      stringBuilder += JSON.stringify(results);
      response.setBody(stringBuilder);
      console.log("loop");
      callback(null, response);
    });
    client.close();
    console.log("im in!");
  });


  /*
  var stringBuilder = "";
  MongoClient.connect(uri)
    .then((db) => {
      console.log("im in!");
      //FIXME issue is im using a different auth method, it feels like I always have to return a promise but perhaps I can manipulate to use the callback as a promise`
      db.listingsAndReviews
        .find({ room_type: "Entire home/apt" })
        .limit(20).then((data) => {
          data.toArray(function(err,docs) {
            stringBuilder += JSON.stringify(docs);
          })
          response.setBody(stringBuilder);
          client.close();
          callback(null, response);
        })
        .catch((err) => {
          console.log("erorr = " + err.stack);
          callback(null, err);
        })
    })
  .catch((e) => {
    console.log("erorr = " + e.stack);
    callback(null, e);
  });*/
  //
  // let strBuilder = ""
  // pgClient.query('SELECT * FROM accounts')
  // .then((res) => {
  //     console.log(res.rows[0]);
  //     for (let row of res.rows) {
  //       console.log(JSON.stringify(row));
  //       strBuilder += JSON.stringify(row) + "\n";
  //     }
  //     response.setBody(strBuilder);
  //
  // })
  // .catch(e => console.error(e.stack));

  // TODO ok now what? I need read and write, would be easier with an app in front
  // of it if: it's easy to just give write permissions so people can't
  // read other's user credentials
  // It seems too easy to read and write this database

  // const accountSid = context.ACCOUNT_SID;
  // const authToken = context.AUTH_TOKEN;
  // const client = require('twilio')(accountSid, authToken);
  //
  // const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID || 'default';
  // const syncDocumentName = "users";

};
