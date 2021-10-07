# Reporters
We support several testsuite execution report types: JUnit, JSON, HTML, and HTML with screenshots and console.
You can select which reporter to use in the `reporters` config file property.

If you don't need to configure the reporters, you can simply set them as an array of strings, specifying the path to the reporter within the UIVeri5 folder. You can pass along options to the reporter instance when the `reporters` option is a plain object or an array of plain objects. For example, to set the `myProp` property of the reporter `myReporter` to `myValue` use:
```javascript
reporters: [{name: 'myReporter', myProp: 'myValue'}]
```
These are the default settings for each testing profile:
- The console reporter is enabled for all profiles.
- No other reporters are currently enabled for the visual profile.
- The screenshot reporter is enabled for the integration profile.

## Console Reporter
The console reporter is activated by including the name `./reporter/consoleReporter` in the `reporters` config file option. It is enabled by default for all testing profiles and has no further configuration. It adds execution summary in the process console logs. The console reporter respects the selected verbosity level.

Logs are added on spec end, on suite end and on complete execution end. When a spec ends, the failed expectations status and details are printed and in `verbose` mode including the failure stack trace. When a suite ends, a statistic of the execution is printed with respect to specs and expectations, for example, successful and failed spec count, execution times, and expectation failure counts by type. When the entire test run completes, an overall success and failure statistic is printed along with the statistic for each suite.

## JUnit Reporter
The JUnit reporter is activated by including the name `./reporter/junitReporter` in the `reporters` config file option.

It creates an XML file in the [JUnit format](http://llg.cubic.org/docs/junit/) which contains testsuite details and information about disabled or failed expectations. This type of report is commonly integrated in various tools, for example you can publish it in Jenkins using the [JUnit plugin](https://wiki.jenkins.io/display/JENKINS/JUnit+Plugin).

In order to make published results more readable, we've introduced two parameters - `prefix` and `postfix` for the suite name, which are empty strings by default. One use case for them is when you have multiple executions of the same suite with different test data or on different browsers. You can differentiate the executions by having separate config files and setting the prefix and/or postfix. The default location of the report file is `target/report/junitReport.xml`. It can be changed by the `reportName` parameter.

Example configuration:
```javascript
reporters: [{
  name: './reporter/junitReporter',
  reportName: 'target/report/myReport.xml',
  prefix: 'mySuitePrefix',
  postfix: 'mySuitePostfix'
}]
```

## JSON Reporter
The JSON reporter is activated by including the name `./reporter/jsonReporter` in the `reporters` config file option.
It creates a JSON file containing the full overview of test execution. The information is similar to the console reporter output and includes suites and specs statistics and failed expectation details. By default the location of the report file is `target/report/report.json` but it can be changed by setting the `reportName` parameter:
```javascript
reporters: [
  {name: './reporter/jsonReporter', reportName: 'target/report/myReport.json'}
]
```

## HTML Reporter
The HTML reporter is activated by including the name `./reporter/htmlReporter` in the `reporters` config file option.

It is inteded to be used with the visual testing profile. It contains suite statistics and failed expectation details similar to the JSON report. In addition, it displays the images for each visual comparison: reference, actual and diff images for each failure and reference image for each success. You can use a different HTML template if you need to visually customize the report. By default, the location of the report file is `target/report/report.html` and the template HTML is `./reporter/report.tpl.html`. They can be changed by setting respectively the `reportName` and `templateName` parameters:
```javascript
reporters: [{
  name: './reporter/htmlReporter',
  reportName: 'target/report/myReport.html',
  templateName: 'myTemplate.tpl.html'
}]
```

## HTML Screenshot Reporter
The HTML screenshot reporter is activated by including the name `./reporter/screenshotReporter` in the `reporters` config file option. Screenshot reporting is enabled for application testing by default.
The screenshot reporter creates an HTML file with a simple representation of the test execution flow. It creates and stores screenshots on specified moments of test execution:
- on expectation completion (either successful or failed)
- before action execution (after syncing with the application and immediately before interaction). The currently supported actions are: `click` and `sendKeys`.

Screenshots are in png format and follow the naming convention:
- for expectations: fullTestName_indexOfTestExpectation_status_screenshotCreationTime
- for actions: actionName_elementID_screenshotCreationTime

The default location for storing the report and screenshots is the subfolder `target/report/screenshots/` of the current execution directory. It can be changed by the `screenshotsRoot` parameter:
```javascript
reporters: [
  {name: './reporter/screenshotReporter', screenshotsRoot: 'myScreenshots/'}
]
```
You can configure when screenshots are taken. Currently the available options are: on expectation failure, on expectation success, and on action (including both `click` and `sendKeys`).

Reports can be configured by adding the `screenshotReporter` and setting the `takeScreenshot` option.

Example:
```javascript
takeScreenshot: {
  onExpectFailure: true,
  onExpectSuccess: false,
  onAction: false
}
```

## DwC Reporter
The DwC reporter is activated by including the name `./reporter/dwcReporter` in the `reporters` config file option.

It is intended to upload execution results to DwC (Deliver With Confidence) monitoring dashboard. Results are uploaded to Themisto with specified Vector and then displayed in Amalthea dashboard. It creates JSON with the results data, containing the name of the suite, status, capabilities and metadata. This reporter doesn't save any files, just uploads to DwC.

To configure the reporter, several configuration parameteres should be provided:
* themistoUrl - the URL to the Themisto instance
* themistoUser - username for Themisto authentication
* themistoPass - password for Themisto authentication
* vector - vector is the specific software version in DwC that the test is running on

Optional configuration parameters:
* stage - the DwC stage the test is running on
* gitHubRepoName - the name of the GitHub repo where the tests are located
* gitHubRepoUrl - the URL of the GitHub repo

To avoid saving credentials in the code, one possible way for providing user and pass is to read them from environment variables.

Example configuration:
```javascript
const THEMISTO_URL = process.env.THEMISTO_URL;
const THEMISTO_USER = process.env.THEMISTO_USER;
const THEMISTO_PASS = process.env.THEMISTO_PASS;

reporters: [{
  name: './reporter/dwcReporter',
  themistoUrl: THERMISTO_URL,
  themistoUser: THEMISTO_USER,
  themistoPass: THEMISTO_PASS,
  vector: "<vector>",
  stage: "<stage name>",
  gitHubRepoName: "<github repo name>",
  gitHubRepoUrl: "<github repo url>",
}]
```

## Reporter from Command Line:
* add reporter:
```
--confKeys=reporters[1].reportName:"target/report/jsonReport.json";reporters[1].name:"./reporter/jsonReporter";
```

## Combining reporters
You can add, modify and remove reporters. The examples so far showed how to add a new reporter. To modify a reporter, added in a different config level, simply declare the reporter again - with the same name. The instance config of the reporter will be updated with the new definition. Example:
```javascript
/* in profile config file */
reporters: [
  {name: './reporter/screenshotReporter', screenshotsRoot: 'myScreenshots/', reportName: 'myReport.html'}
]

/* in project config file */
reporters: [
  {name: './reporter/screenshotReporter', screenshotsRoot: 'newScreenshots/'}
]

/* result will be */
reporters: [
  {name: './reporter/screenshotReporter', screenshotsRoot: 'newScreenshots/', reportName: 'myReport.html'}
]
```

If you need two instances of a reporter, add an ID instance config property. Existing reporters with the same name will remain unchanged.
```javascript
/* in profile config file */
reporters: [
  {name: './reporter/screenshotReporter', id: "my-report", screenshotsRoot: 'myScreenshots/', reportName: 'myReport.html'}
]

/* in project config file */
reporters: [
  {name: './reporter/screenshotReporter', id: "new-report", reportName: 'newReport.html'}
]

/* result will be */
reporters: [
  {name: './reporter/screenshotReporter', id: "my-report", screenshotsRoot: 'myScreenshots/', reportName: 'myReport.html'},
  {name: './reporter/screenshotReporter', id: "new-report", reportName: 'newReport.html'}
]
```

The `reporters` property can be have an object value with expected keys `enabled` and `disabled`. As the names suggest, reporters in the `enabled` collection will be executed, while the ones in the `disabled` collection will not. The following two lines produce the same result:
```javascript
reporters: [
  {name: './reporter/jsonReporter', reportName: 'target/report/myReport.json'}
]
/* is the same as */
reporters: {
  disabled: [],
  enabled: [
    {name: './reporter/jsonReporter', reportName: 'target/report/myReport.json'}
  ]
}
```
The following example disables a reporter, even if it was added earlier in a configuration file with lower priority:
```javascript
reporters: {
  disabled: [
    {name: './reporter/jsonReporter'}
  ]
}
```
Note that if an ID is provided to the enabled or disabled reporter, only existing reporters with the matching ID will be modified.
