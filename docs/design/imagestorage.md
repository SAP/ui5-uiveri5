Image storage backend is the place where reference images are kept.

### Definitions
Runtime is a set of specific OS, resolution, browser, theme, direction, and mode that is supported.

### Visual Tests Workflow

#### Local with Upload
1. Create new visual test and run it locally against a preferred runtime
(emulated - chrome with mobile emulation and/or standard)
2. Check the images and correct what is necessary.
3. When happy with the result, run the test with `--update` flag that updates the .lnk files.
4. Then, run the test with `--upload` flag that will __upload the new screenshots__ in the imagestore.
5. Commit your changes (that cover test and .lnk files) and push to gerrit.

If necessary, this sequence can be repeated many times. A side effect is that several images could be created
that will be referenced by intermediate commits and at the end, when the gerrit review is merged, those images
could become orphaned. This is not a big issue, please continue reading below for the rest of the runtimes.

#### Local with Central Upload
1. Create new visual test and run it locally against a preferred runtime
(emulated - chrome with mobile emulation and/or standard)
2. Check the images and correct what is necessary.
3. Commit your changes and push to gerrit.
4. Merge the change - the test becomes applicable for central execution.
5. Central execution runs with `--update` and `--upload` flags, prepares a commit, adds responsible as reviewer
and pushes a gerrit review.
6. Check the images centrally and locally.
7. [Optional] Reproduce the test with `--compare` flag activated.
8. Submit the gerrit review confirming that the images are correct.

These steps should be executed for every runtime when image comparison finds a difference. If the visual
difference is a real issue, you should fix the control and/or test and __do not submit the review__
till this is done.

This workflow covers all cases - new test, changes in test, and changes in controls. Sporadic image comparison failures
are handled as changes in test.

Optimization:
In case reference image is not updated immediately, on every next execution, a new actual image is generated and
updated in gerrit+imagestore. Central image generation should recognize the case and explicitly update already existing
review+imagestore for this test/runtime/committer.

### Image Storage

#### Operations
* Download - download a specific image by its UUID
* Upload - upload a specific image and store by its UUID
* Delete - delete a specific image by UUID

Upload and Delete operations are user/password protected

#### REST API
TODO

### General
* Storage strategy

We store only images accessible from any commit in supported branches (whitelist - master, rel-* )
This ensures that we do not keep for long time the 'intermediate' images generated and commited in git/gerrit (ref/for/* )
and imagestore while test is being stabilised.
This way, we avoid image storage DB bloat without a strict need to delete the to-become-orphaned images.

* Git synchronization and orphaned images handling

A backend job regularly and incrementally scans commits information from git and updates it in the DB.
In this process, orphan images are discovered and marked so.
Orphaned images are images that are not referenced in any commit.
If configured, orphan images are deleted (automatically or manually - UI needed).

#### Storage

##### REST API
* CRUD on images

#### Management
Job scheduling and configuration (git scan, automatic orphan delete) is handled outside imagestore.

##### REST API
* CRUD on runtimes
* CRUD on orphaned images







