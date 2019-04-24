# Development

## Git

### Make a fork
Fork a repository from Github UI.

Clone fork locally:
```
git clone https://github.com/<user>/ui5-uiveri5.git
```

Configure the origin:
```
git remote add upstream https://github.com/<user>/ui5-uiveri5.git
```

### Make changes and push commits
Possibly work in a local branch:
```
git checkout -b <local branch>
```

Make changes, commit them:
```
git commit -am "chore: minor stuff"
```

Push the new commit to remote fork:
```
git push origin <local branch>
```

### Make pull request, discuss and make more commits, update the pull request

### Once pull is merged, update the fork
Take upstream changes locally:
```
git checkout master
git fetch upstream
git rebase upstream/master
```

Update the fork remote repo:
```
git push origin master
```

And delete the local branch:
```
git branch -d <local branch>
```

For more information, see [Keeping your forked repo synced with the upstream source](https://2buntu.com/articles/1459/keeping-your-forked-repo-synced-with-the-upstream-source/).

## Testing

### Run all unit tests
```
$ npm run test:unit
```

### Run specific unit test
```
$ npm run test:unit --specs spec/StatisticsCollector.spec.js
```

### Run all E2E tests
```
$ npm run test:e2e
```
By default, UI5 tests are executed against the latest OpenUI5 release.
To change the version, modify the UI5 bootstrap script in `uiveri5/e2e/UI5/index.html`.

### Run all tests (unit and E2E)
```
$ npm run test
```

## Release
### Release new version

Make sure you have set up correctly your local copy of a fork with `upstream` and `origin` remotes.

* Create a local branch over an up-to-date master branch
```
git checkout -b release
```

* Increment version in package.json.
Increment patch number if this release contains only bugfixes or increment minor version number if it contains features.

* Commit version increment change
```
git commit -am "chore: update version to 1.xx.v"
```

* Create tag
```
git tag v1.xx.y
```

* Push the new tag
```
git push --tags upstream release:master
```

* Create new release in Github UI

* Push the new release to npm
```
npm publish
```
