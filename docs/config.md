#### Config file
Config file is a node module that exports a single 'config' object of type: 'visualtes.js/Config'
Config file could specify a profile that is another config file with name <profile>.profile.conf.js

### Command-line arguments
Command-line arguments override options from config file, config file overwrites options from profile config file,
profile overwrites build-in defaults.

command-line no conf -> default.conf.js profile=visual -> visual.profile.conf.js -> build-in defaults
command-line conf=conf.js -> conf.js no profile -> visual.profile.conf.js -> build-in defaults
command-line conf=conf.js -> conf.js profile=integration -> integration.profile.conf.js -> build-in defaults

### Browser capabilities
``` json
browsers: [{
  browserName: 'chrome',            // chrome, firefox, ie, safari
  browserVersion: '40',             // version or missing for latest available
  platformName: 'windows',          // windows,mac,linux,android,ios
  platformVersion: '8',             // like: 8,9,... for IE, 5.0,5.1,... for Android, ...
  platformResolution: '1024x768',   // defines also orientation
  ui5Theme:
  ui5Direction:
  ui5Mode:
}]
```

parallel browsers in protractor:
http://www.ngroutes.com/questions/AUuAC2THa5vEqxqlK3lQ/e2e-testing-on-multiple-parallel-browsers-in-protractor.html
