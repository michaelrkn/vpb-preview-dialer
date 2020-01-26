const fs = require('fs')
const sourceFolder = path.join(__dirname, '..', 'functions')

exports.listLocalFunctions = function listLocalFunctions() {
    const localFunctions = fs.readdirSync(sourceFolder)
    return localFunctions.match(/(.*)[^.js]+/g)
}