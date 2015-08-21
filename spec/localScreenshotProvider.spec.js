/**
 * Created by I304310 on 6/15/2015.
 */

require('../src/localScreenshotProvider.js')({take: false}).register();

describe("RemoteSAPUI5SpecResolver", function () {
  it('Should have mismatch percentage less than 10%.', function () {
    spyOn(global, 'takeScreenshot');
    takeScreenshot();
    expect(takeScreenshot).toHaveBeenCalled();
  });

  it('Should have mismatch percentage less than 10%.', function () {
    var screenshot = takeScreenshot();
    expect(screenshot.length).toBe(0);
  });

});
