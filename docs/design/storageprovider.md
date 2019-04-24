
### Execution Flow

#### Operation
* --cache - downloads reference images from imagestore, default: true
  * --imageStoreUrl, default to: http://imagestore.hana.ondemand.com
* --take - takes screenshots, default: `true`
* --compare - executes image comparison, default: `true`
* --update - updates reference images (if different) with actual images on LOCAL file system, default: false
* --upload - uploads reference images to imagestore
  * --imageStoreUrl, default to: http://imagestore.hana.ondemand.com

### Runtime Structure
```wiki
<TestName>/
    +---<Platform>/
        +---<Resolution>/
            +---<Browser>/
                +---<Theme>/
                    +---<RTL|LTR>/
                        +---<Cosy|Compact>/
```

### LocalStorageProvider

#### Operation
* --cache - nothing to do as the images are already in src/
  * not used
* --take - takes screenshots
  * if false => doesn't take act
  * if true => takes act
* --compare - does image comparison (and diff image generation of different in target/)
  * if ( compare && take ) => runs compare => takes act && resolves ref
  * else => doesn't compare => doesn't take act && doesn't resolve ref
* --update - copies the different actual images as reference in the src/
  * if (update && take && compare) => takes act -> compares -> if different => saves act as ref
* --upload - nothing to do
  * not used

#### Reference Image Structure
```wiki
some.lib/
+---test
    +---some/
        +---lib/
            +---SomeControl.html
                visual/
                +---visual.suite.js
                    SomeControl.spec.js
                    images/
                    +---<runtime structure>/
                        +---initial.ref.png
```
#### Runtime Image Structure
```wiki
target/
+---images/
  +---<runtime structure>/
      initial.act.png
      initial.diff.png
      ...
```

### RemoteStorageProvider

#### Operation
* --cache - reads the (applicable for current spec set) ref.lnk files and downloads from imagestore to target/
* --take - takes screenshots
* --compare - does image comparison (and diff image generation of different in target/)
* --update - updates/creates the .lnk files
* --upload - uploads (changed) ref+act+diff images to imagestore

Upload of pictures is user/password protected to prevent accidental/unauthorized image uploads.

#### Reference Image Structure
```wiki
some.lib/
+---test
    +---some/
        +---lib/
            +---SomeControl.html
                visual/
                +---visual.suite.js
                    SomeControl.spec.js
                    images/
                    +---<runtime structure>/
                        +----initial.ref.lnk
```

#### Runtime Image Structure
```wiki
target/
+---images/
  +---<runtime structure>/
      initial.ref.png
      initial.act.png
      initial.diff.png
      ...
```
