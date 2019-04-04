# Command-line arguments

## Boolean Arguments
Use the `no-` syntax for specifying values of boolean parameters:
```
$ uiveri5 --no-useSeleniumJar
```
## Override arbitrary configuration from command line:
* As single value with object notation:
```console
--config.specResolver.contentRootUri=sdk/test-resources
```
* As single value with complex object notation syntax:
```console
--confKeys=locators[1].name:myCustomLocator;
```
* As several single values:
```console
--confKeys=locators[1].name:myCustomLocator;locators[1].arg1:value1;
```
* Change the `reportName` of already delcared reporter:
```
--confKeys=reporters[0].reportName:"target/report/jsonReports/report.json"
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
