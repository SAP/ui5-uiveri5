describe('DirectConnectionProvider', function() {
  var path = require('path');
  var ConnectionProvider = require('../src/connection/directConnectionProvider');
  var logger = require('../src/logger');

  var downloadDriversMock = require('./directConnectionProvider/downloadDriversMock')();
  var mockUrl = 'http://localhost';
  var directConnectionProvider;
  var testBinaries;

  beforeAll(function(done) {
    process.env.NO_PROXY = process.env.NO_PROXY || 'localhost';
    downloadDriversMock.start().then(function(port) {

      mockUrl += ':' + port;

      testBinaries = {
        chromedriver:
          {
            version: '{latest}',
            filename: 'chromedriver',
            executable: 'chromedriver-{latest}',
            baseurl: mockUrl,
            latestVersionUrl: mockUrl + '/LATEST_RELEASE',
            url: mockUrl + '/{latest}/chromedriver_win32.zip',
          },
        chromedriverGHConfig:
          {
            version: '{chrome.latest}',
            latestMajorVersionFileUrl: mockUrl + '/driverVersions.json',
            filename: 'chromedriver',
            executable: 'chromedriver-{chrome.latest}',
            baseurl: mockUrl,
            latestVersionUrl: mockUrl + '/LATEST_RELEASE_{chrome.latest}',
            url: mockUrl + '/{chrome.latest}/chromedriver_win32.zip',
          },
        chromedriverDirectUrl:
          {
            version: '{chrome.latest}',
            useDirectUrl: true,
            latestVersionDirectUrl: mockUrl + '/LATEST_RELEASE',
            latestMajorVersionFileUrl: mockUrl + '/driverVersions.json',
            filename: 'chromedriver',
            executable: 'chromedriver-{chrome.latest}',
            baseurl: mockUrl,
            latestVersionUrl: mockUrl + '/LATEST_RELEASE_{chrome.latest}',
            url: mockUrl + '/{chrome.latest}/chromedriver_win32.zip',
          },
        chromedriverLocal:
          {
            localPath: path.join(__dirname, 'directConnectionProvider/mockChromeDriver.js')
          },
        chromedriverSpecificVersion:
          {
            version: '73'
          },
        geckodriver:
          {
            version: '{latest}',
            filename: 'geckodriver',
            executable: 'geckodriver-{latest}',
            baseurl: mockUrl,
            latestVersionRedirectUrl: mockUrl + '/latest',
            url: mockUrl + '/download/{latest}/geckodriver-{latest}-win32.zip',
          },
        chromedriverExisting:
          {
            executable: '../spec/directConnectionProvider/mockChromeDriver.js'
          }
      };

      directConnectionProvider = new ConnectionProvider({}, {binaries: testBinaries}, logger);
      done();
    });

  });

  it('Should get the lestest chromedriver version', function(done) {
    var version = directConnectionProvider._getLatestVersion(testBinaries.chromedriver);
    version.then(function(result){
      expect(directConnectionProvider.binaries.chromedriver.version).toBe('1.0');
      expect(directConnectionProvider.binaries.chromedriver.executable).toBe('chromedriver-1.0');
      expect(directConnectionProvider.binaries.chromedriver.url).toBe(mockUrl + '/1.0/chromedriver_win32.zip');
      done();
    })
  });

  it('Should get the latest chromedriver version for a given chrome major version', function(done) {
    var version = directConnectionProvider._getLatestVersion(testBinaries.chromedriverGHConfig);
    version.then(function(result){
      expect(directConnectionProvider.binaries.chromedriverGHConfig.version).toBe('73.4');
      expect(directConnectionProvider.binaries.chromedriverGHConfig.executable).toBe('chromedriver-73.4');
      expect(directConnectionProvider.binaries.chromedriverGHConfig.latestVersionUrl).toBe(mockUrl + '/LATEST_RELEASE_73');
      expect(directConnectionProvider.binaries.chromedriverGHConfig.latestVersionUrl).toBe(mockUrl + '/LATEST_RELEASE_73');
      expect(directConnectionProvider.binaries.chromedriverGHConfig.url).toBe(mockUrl + '/73.4/chromedriver_win32.zip');
      done();
    })
  });

  it('Should get the latest chromedriver version from the direct url', function (done) {
    var version = directConnectionProvider._getLatestVersion(testBinaries.chromedriverDirectUrl);
    version.then(function () {
      expect(directConnectionProvider.binaries.chromedriverDirectUrl.version).toBe('1.0');
      expect(directConnectionProvider.binaries.chromedriverDirectUrl.executable).toBe('chromedriver-1.0');
      expect(directConnectionProvider.binaries.chromedriverDirectUrl.url).toBe(mockUrl + '/1.0/chromedriver_win32.zip');
      done();
    })
  });

  it('Should get the latest geckodriver version', function(done) {
    var version = directConnectionProvider._getLatestVersion(testBinaries.geckodriver);
    version.then(function(result){
      expect(directConnectionProvider.binaries.geckodriver.version).toBe('2.0');
      expect(directConnectionProvider.binaries.geckodriver.executable).toBe('geckodriver-2.0');
      expect(directConnectionProvider.binaries.geckodriver.url).toBe(mockUrl + '/download/2.0/geckodriver-2.0-win32.zip',);
      done();
    });
  });

  it('Should get the specified chromedriver version', function (done) {
    var version = directConnectionProvider._getLatestVersion(testBinaries.chromedriverSpecificVersion);
    version.then(function (result) {
      expect(result).toBeFalsy();
      expect(directConnectionProvider.binaries.chromedriverSpecificVersion.version).toBe('73');
      done();
    })
  });

  it('Should use local chromedriver when local path is provided', function(done) {
    var version = directConnectionProvider._getBinaryFileName('chromedriverLocal');
    version.then(function (filename) {
      expect(filename).toBe(testBinaries.chromedriverLocal.localPath);
      done();
    })
  });

  it('Should not download chromedriver if already available', function (done) {
    var version = directConnectionProvider._downloadBinary(testBinaries.chromedriverExisting);
    version.then(function (result) {
      expect(result).toBe(path.join(__dirname, '/directConnectionProvider/mockChromeDriver.js'));
      done();
    })
  });

});
