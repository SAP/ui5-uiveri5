## Debugging

### Node v7.7.0 and Later
Node legacy debugger is deprecated. Node Inspector and DevTools are recommended instead.
To enable debugging, start UIVeri5 with `debug` option (or its alias `inspect`): `uiveri5 --debug`. To stop on a certain line, add `debugger` to your test:
```javascript
myElement.getText().then(text => {
  debugger;
  expect(text).toEqual("myText");
});
```

### Older Node Releases
Use legacy debugger and set breakpoints with `browser.pause()` and `browser.debugger()`
```javascript
myElement.getText().then(function (text) {
  browser.debugger();
  expect(text).toEqual("myText");
});
```

For more details, see:
* https://github.com/angular/protractor/blob/master/docs/debugging.md
* https://github.com/angular/protractor/issues/4307
* https://nodejs.org/en/docs/guides/debugging-getting-started/
