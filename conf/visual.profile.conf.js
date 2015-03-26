exports.config = {
  specResolver: './remoteSAPUI5SpecResolver', // or localSpecResolver.js
  remoteSAPUI5SpecResolver:  {
    specCacheRoot: '../target/specs'
    //TODO specs: '*.spec.js'
  }
}
