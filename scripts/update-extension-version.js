// e.g. node scripts/update-extension-version major

const type = process.argv[2]
const fs = require('fs')
const path = require('path')

const manifestPath = path.join(__dirname, '..', 'extension/manifest.json')
const manifest = require(manifestPath)

let [ major, minor, patch ] = manifest.version.split('.')

switch(type) {
    case 'major': major++; patch = 0; break;
    case 'minor': minor++; patch = 0; break;
    case 'patch': patch++; break;
    default: throw new Error('You must set a version type option of major, minor, or patch.')
}

const newManifest = {
    ...manifest,
    version: `${major}.${minor}.${patch}`
}

fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2))