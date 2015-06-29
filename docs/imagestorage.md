Image storage backend is the place where reference images are kept.

### Definitions
Runtime is a set of specific os/resolution/browser/theme/direction/mode that is supported

### Visual tests workflow

#### Local with upload
A developer creates his new visual test. He runs it locally against his preferred runtime
( emulated - chrome with mobile emulation and/or standard ) checks the images and corrects whats is necessayr.
When happy with the result he runs with --update flag that updates the .lnk files. Then he runs with --upload that will
__uploads the new screenshots__ in the imagestore. Then he commits his changes ( that cover test and .lnk files)
and pushes his commit to gerrit. If necessary, this sequence could be repeated many times.
A side effect is that several images could be created that will be referenced by intermediate commits and at the end,
when the gerrit review is merged those images could become orphaned. But this is not such an issue, please check below.
Please continue reading below for the rest of runtimes.

#### Local with central upload
Same as above till before the --update step. He misses the --update and --upload steps, then just commits his test and
pushes to gerrit. When merged, the test will become applicable for central execution.
Central execution runs with --update and --upload flags and will prepare a commit ( from the name of the developer
of the test ) and push a gerrit review to his name. He will check the images and ( centrally, locally), he could in theory
reproduce the test with --compare activated. Then he submits the gerrit review and this way confirms the images
are fine. This happens once for every runtime when image comparison finds a difference.
If the visual difference is real issue, the developer should fix the control and/or test and __do not submit the review__
till this is done.
This workflow covers all cases - new test, changes in test and changes in controls. Sporadic image comparison failures
will be handled like changes in test.

Optimization:
In case recerence image is not updated imediatelly, on every next execution a new actual image will be generated and
updated in gerrit+imagestore. Central image generation should recognize the case and explicitly update already existing
review+imagestore for this test/runtime/commiter.

### Image storage

#### Operations
* Download - downloads a specific image by its uuid
* Upload - uploads a specific image and store by its uuid
* Delete - deletes a specific image by uuid

Upload and Delete operations are user/password protected

#### REST api
TODO

### Management
* Storage strategy
we store only images accessible from any commit in supported branches (whitelist - master, rel-* )
This means that we do not keep for long time the 'intermediate' images generated and commited in git/gerrit (ref/for/*)
and imagestore while test is being stabilised.
So this way we avoid image storage DB bloat without a strict need to delete to-become-orphaned images.

* Git synchronization and orphaned images handling
A backend job regularly scans commits ( incrementally ) information from git and updates it in the DB
In this process orphan images are discovered and marked so.
Orphaned images are such that do are not referenced in any commit.
If configured, orphan images are deleted ( automatically or manually - UI needed)

#### Operations
* CRUD on runtimes
* CRUD on orphaned images

Job scheduling and configuration (git scan, automatic orphan delete) is handled outside imagestore.

#### REST api
TODO







