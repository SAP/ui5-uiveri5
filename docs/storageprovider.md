
### Execution flow

#### Operation
* --cache - download reference images from imagestore, default: true
  * --imageStoreUrl, default to: http://imagestore.hana.ondemand.com
* --take - take screenshots, default: true
* --compare - execute image comparison, default: true
* --update - update reference images (if differ) with actual images on LOCAL file system, default: false
* --upload - upload reference images to imagestore
  * --imageStoreUrl, default to: http://imagestore.hana.ondemand.com

### Runtime structure
```wiki
<TestName>/
    +---<OS>/
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
* --take - take screenshots
  * if false => no take act
  * if true => take act
* --compare - does image comparison ( and diff image generation of different in target/)
  * if ( compare && take ) => run compare => take act && resolve ref
  * else => no compare => no take act && no resolve ref
* --update - copies the different actual images as reference in the src/
  * if ( update && take ) => take act -> copy as ref
* --upload - nothing to do
  * not used

#### Reference image structure
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
#### Runtime image structure
```wiki
target/
+---images/
  +---<runtime structure>/
      initial.act.png
      initial.diff.png
      ...
```

### RemoteLfsStorageProvider

#### Operation
* --cache - reads the (applicable for current spec set) ref.lnk files and downloads from imagestore to target/
* --take - take screenshots
* --compare - does image comparison ( and diff image generation of different in target/)
* --update - update/create the .lnk files
* --upload - upload (changed) reference images to imagestore

Upload of pictures is user/password protected so to prevent accidental/unauthorized image uploads.

#### Reference image structure
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

#### Runtime image structure
```wiki
target/
+---images/
  +---<runtime structure>/
      initial.ref.png
      initial.act.png
      initial.diff.png
      ...
```
