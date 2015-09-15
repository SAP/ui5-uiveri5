/**
 * Created by I304310 on 6/15/2015.
 */

require('../src/localScreenshotProvider.js')({take: true}).register();

describe("RemoteSAPUI5SpecResolver", function () {
  it('Should call takeScreenshot from global variable.', function () {
    spyOn(global, 'takeScreenshot');

    takeScreenshot();

    expect(takeScreenshot).toHaveBeenCalled();
  });
});
