# Command-line arguments

## Boolean argumens
Use the 'no-' syntax for specifying values of boolean parameters
```
$ uiveri5 --no-useSeleniumJar
```

## Override arbitrary configuration from command line:
You could override arbitrary config value from command like:

* as single value with object notation
```console
--config.specResolver.contentRootUri=sdk/test-resources
```

* as single value with complex object notation syntax
```console
--confKeys=locators[1].name:myCustomLocator;
```

* as several single values
```console
--confKeys=locators[1].name:myCustomLocator;locators[1].arg1:value1;
```

* change the reportName of already delcared reporter
```
--confKeys=reporters[0].reportName:"target/report/jsonReports/report.json"
```

* as json object
```console
// linux console
--config={"specResolver":{"name": "myCustomResolver","arg1":"value1"}}
// windows console
--config={\"specResolver\":{\"name\": \"myCustomResolver\",\"arg1\":\"value1\"}}
// java-based environments ( WebStorm debug configuration )
--config={\\\"specResolver\\\":{\\\"name\\\": \\\"myCustomResolver\\\",\\\"arg1\\\":\\\"value1\\\"}}
```

* as json object arrays are merged
```console
--config={"locators":[{"name":"myCustomLocator"}]}
```