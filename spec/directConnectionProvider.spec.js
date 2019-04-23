describe('DirectConnectionProvider', function() {
  var ConnectionProvider = require('../src/connection/directConnectionProvider');
  var logger = require('../src/logger')(3);

  var downloadDriversMock = require('./directConnectionProvider/downloadDriversMock')();
  var mockUrl = 'http://localhost';
  var directConnectionProvider;
  var binaries;
  beforeAll(function(done) {
    process.env.NO_PROXY = process.env.NO_PROXY || 'localhost';
    downloadDriversMock.start().then(function(port) {

      mockUrl += ':' + port;

      binaries = {
        chromedriver:
          {
            version: '{latest}',
            filename: 'chromedriver',
            executable: 'chromedriver-{latest}',
            baseurl: mockUrl,
            latestVersionUrl: mockUrl + '/LATEST_RELEASE'
          },
          chromedriverGHConfig:
          {
            version: '{chrome.latest}',
            latestVersionFileUrl: mockUrl + '/driverVersions.json',
            filename: 'chromedriver',
            executable: 'chromedriver-{chrome.latest}',
            baseurl: mockUrl,
            latestVersionUrl: mockUrl + '/LATEST_RELEASE_{chrome.latest}'
          },
        geckodriver:
          {
            version: '{latest}',
            filename: 'geckodriver',
            executable: 'geckodriver-{latest}',
            baseurl: mockUrl,
            latestVersionUrlRedirect: mockUrl + '/latest'
          }
      };

      directConnectionProvider = new ConnectionProvider({}, {binaries: binaries}, logger);
      done();
    });

  });

  it('Should get the lestest chromedriver version', function(done) {
    var version = directConnectionProvider._getLatestVersion(binaries.chromedriver);
    version.then(function(result){
      expect(directConnectionProvider.binaries.chromedriver.version).toBe('1.0');
      expect(directConnectionProvider.binaries.chromedriver.executable).toBe('chromedriver-1.0');
      done();
    })
  });

  it('Should get the latest chromedriver version for a given chrome major version', function(done) {
    var version = directConnectionProvider._getLatestVersion(binaries.chromedriverGHConfig);
    version.then(function(result){
      expect(directConnectionProvider.binaries.chromedriverGHConfig.version).toBe('73.4');
      expect(directConnectionProvider.binaries.chromedriverGHConfig.executable).toBe('chromedriver-73.4');
      expect(directConnectionProvider.binaries.chromedriverGHConfig.latestVersionUrl).toBe(mockUrl + '/LATEST_RELEASE_73');
      done();
    })
  });

  it('Should get the latest geckodriver version', function(done) {
    var version = directConnectionProvider._getLatestVersion(binaries.geckodriver);
    version.then(function(result){
      expect(directConnectionProvider.binaries.geckodriver.version).toBe('2.0');
      expect(directConnectionProvider.binaries.geckodriver.executable).toBe('geckodriver-2.0');
      done();
    })
  })
});
