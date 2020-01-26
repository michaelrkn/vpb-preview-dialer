const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fs = require('fs')
const path = require('path')
const client = require('twilio')(accountSid, authToken);
const { listLocalFunctions } = require('../twilio/util')

const sourceFolder = path.join(__dirname, '../twilio/functions')

async function run(serviceSid) {
    const localFunctions = listLocalFunctions()
    
    const {functions} = await client.serverless.services(sid)
                 .list({limit: 20})
                 .then(services => services.forEach(s => console.log(s.sid)));
    
    for (const friendlyName of localFunctions) {
        const functionSid = functions.find(fn => fn.friendlyName === friendlyName).sid
        const sourcePath = path.join(sourceFolder, `${friendlyName}.js`)
        const result = await uploadVersion(serviceSid, functionSid, friendlyName, sourcePath)
        console.log('Published %s (%s): %s', file, result.sid, result.url)
    }

}

run().catch(console.error)

async function uploadVersion(serviceSid, functionSid, urlPath, sourcePath) {
    const response = await client
    .request({
      method: 'POST',
      uri:
        `https://serverless-upload.twilio.com/v1/Services/${serviceSid}/Functions/${functionSid}/Versions`,
      data: {
        Path: urlPath,
        Visibility: 'public',
        Content: {
          value: fs.createReadStream(sourcePath),
          options: {
            contentType: 'application/javascript'
          }
        }
      }
    })
    if (response.statusCode === 201) {
        const newVersion = JSON.parse(response.body);
        return newVersion
    } else {
        console.error(response);
    }
}