
# Application testing

## Test organization

### Test Data
Extract all test content constants in a single test data object.

### Page Objects
Define all selectors in a hierarchical page objects.

## Selectors
Prefer hierarchical class selectors. Try to compose them the way you would explain to a human where to click.

### Avoid ID selectors
Selection a DOM element by ID is the simplest and widely used approach in classical web site testing.
The classical web page is composed manually and so the important elements are manually assigned nice
and meaningful IDs. So it is easy to identify those elements in automatic tests.
But in highly-dynamic JS frameworks like SAPUI5 the DOM is generated out of the views. The views could
also be generated from the content meta-information. Usually the ID of UI5 control contain the control
name and a suffix that is the sequential number of this type of control in this app. So the root element
of a view could have id like "__xmlview1".
There are several problems with using such generated IDs in application tests.
1. IDs are mostly static between application runs but they will definitely change when the application is modified.
Even minor unrelated change like adding one more button in some common area like header could cause a change of
all IDs. This will require changes in all selectors used in all tests for this application.
2. There are cases when the generated IDs will be different depending on the environment the application is running.
2. Generated IDs are totally not self-documenting and this makes the test harder to understand and maintain.

### Avoid non-visible attributes
Think from the point of view of the users. Users do not see DOM nodes and their attributes but see them rendered.
So write selectors that include only "visible" attributes. 
This also makes the test much self-documenting and simplifies maintenance.

### Minimize use of attribute selectors




