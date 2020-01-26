const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const uniqueName = process.env.TWILIO_SERVICE_NAME
const friendlyName = process.env.TWILIO_SERVICE_FRIENDLY_NAME
const { listLocalFunctions } = require('../twilio/util')

const client = require('twilio')(accountSid, authToken);

async function run() {
    const service = await client.serverless.services
                 .create({
                    includeCredentials: true,
                    uniqueName,
                    friendlyName
                  })

    const serviceSid = service.sid
    console.log('Created service %s (%s)', service.friendlyName, serviceSid)
    console.table(service.links)

    // @TODO Should dev and prod be consolidated to one account, two environments?
    console.log('Creating dev environment')
    const environment = await client.serverless.services(sid)
                 .environments
                 .create({domainSuffix: 'dev', uniqueName: 'dev-environment'})

    const envSid = environment.sid
    console.log('Created environment %s: (%s)', envSid, environment.url)

    const friendlyNames = listLocalFunctions()

    const createFunctions = friendlyNames.map(friendlyName => client.serverless.services('ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
    .functions
    .create({friendlyName}))

    const functions = await Promise.all(createFunctions)

    functions.forEach(fn => {
        console.log("Created function %s (%s)", fn.friendlyName, fn.url)
        console.dir(fn.links)
    })
    
}

run().catch(console.error)

// example services.create resopnse:
// {
//     "sid": "ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "friendly_name": "My New App",
//     "unique_name": "my-new-app",
//     "include_credentials": true,
//     "date_created": "2018-11-10T20:00:00Z",
//     "date_updated": "2018-11-10T20:00:00Z",
//     "url": "https://serverless.twilio.com/v1/Services/ZS00000000000000000000000000000000",
//     "links": {
//       "environments": "https://serverless.twilio.com/v1/Services/ZS00000000000000000000000000000000/Environments",
//       "functions": "https://serverless.twilio.com/v1/Services/ZS00000000000000000000000000000000/Functions",
//       "assets": "https://serverless.twilio.com/v1/Services/ZS00000000000000000000000000000000/Assets",
//       "builds": "https://serverless.twilio.com/v1/Services/ZS00000000000000000000000000000000/Builds"
//     }
//   }



// Example environment create response
// {
//     "sid": "ZEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "service_sid": "ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "build_sid": null,
//     "unique_name": "dev-environment",
//     "domain_suffix": "dev",
//     "domain_name": "foobar-1234-stage.twil.io",
//     "date_created": "2018-11-10T20:00:00Z",
//     "date_updated": "2018-11-10T20:00:00Z",
//     "url": "https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Environments/ZE00000000000000000000000000000000",
//     "links": {
//       "variables": "https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Environments/ZE00000000000000000000000000000000/Variables",
//       "deployments": "https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Environments/ZE00000000000000000000000000000000/Deployments",
//       "logs": "https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Environments/ZE00000000000000000000000000000000/Logs"
//     }
//   }


// Example function creation response
// {
//     "sid": "ZHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "service_sid": "ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//     "friendly_name": "firstfunc",
//     "date_created": "2018-11-10T20:00:00Z",
//     "date_updated": "2018-11-10T20:00:00Z",
//     "url": "https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Functions/ZH00000000000000000000000000000000",
//     "links": {
//       "function_versions": "https://serverless.twilio.com/v1/Services/ZSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Functions/ZH00000000000000000000000000000000/Versions"
//     }
//   }