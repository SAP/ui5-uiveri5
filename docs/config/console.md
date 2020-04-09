# Command-line arguments

## Boolean Arguments
Use the `no-` syntax for specifying values of boolean parameters:
```
$ uiveri5 --no-useSeleniumJar
```
## Override arbitrary configuration from command line:
* As single key with object notation:
```console
--config.specResolver.contentRootUri=sdk/test-resources
```
* As single key with complex object notation syntax:
```console
--confKeys=locators[1].name:myCustomLocator;
```
* As several keys:
```console
--confKeys=locators[1].name:myCustomLocator;locators[1].arg1:value1;
* As one or several keys with array values:
```console
--confKeys=locators[1].name:"[value1, value2]";locators[1].arg1:"[value1, value2]";
```
* As JSON object:
```console
// linux console
--config={"specResolver":{"name": "myCustomResolver","arg1":"value1"}}
// windows console
--config={\"specResolver\":{\"name\": \"myCustomResolver\",\"arg1\":\"value1\"}}
// java-based environments ( WebStorm debug configuration )
--config={\\\"specResolver\\\":{\\\"name\\\": \\\"myCustomResolver\\\",\\\"arg1\\\":\\\"value1\\\"}}
```
* As merged JSON object arrays:
```console
--config={"locators":[{"name":"myCustomLocator"}]}
```
### Practical examples
* Change the `reportName` of already delcared reporter:
```
--confKeys=reporters[0].reportName:"target/report/jsonReports/report.json"
```
* Change the browser options:
```
--confKeys=browsers[0].capabilities.chromeOptions.args:"[--headless, --window-size=700,800]"
```
