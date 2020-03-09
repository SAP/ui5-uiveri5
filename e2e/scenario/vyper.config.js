/* eslint-disable no-undef */
exports.config = {
  directConnect: true,

  capabilities: {
    "browserName": "chrome",
    loggingPrefs: {
      "driver": "ALL",
      "server": "ALL",
      "browser": "ALL"
    },
    chromeOptions: {
      args: [
        "--window-size=1920,1080",
        "--no-sandbox",
        "--headless",
        "--ignore-certificate-errors",
        "--disable-web-security",
        "--enable-logging",
        "--disable-infobars",
        "--disable-extensions"
      ],
      prefs: {
				// disable chrome's annoying password manager
        "profile.password_manager_enabled": false,
        "credentials_enable_service": false,
        "password_manager_enabled": false
      }
    }
  },
  params: {
    clientInverval: 1,
    auth: { //please note that the login is done via the first .spec !
      formType: "plain",
      username: "BPC_EXPERT",
      password: "Welcome1!"
    },
    coverage: {
      status: false,
      coverage_files: ["mm_mng_prpsls1"],
      sourcePath: "./sourceFolder"
    }
  },
	/* eslint-disable sap-no-hardcoded-url */
  baseUrl: "https://sapui5.hana.ondemand.com/test-resources/sap/m/demokit/cart/webapp/index.html",
	//'https://qs9-715.wdf.sap.corp/ui?sap-ui-xx-componentPreload=on#ProcurementCatalog-manageRecommendations',
	//	'https://qs9-715.wdf.sap.corp/ui?sap-ui-xx-componentPreload=off#ProcurementCatalog-manageRecommendations',

	// Framework to use. Jasmine is recommended.
  framework: "jasmine2",

  allScriptsTimeout: 290000000, //important for loading to complete
  getPageTimeout: 120000,
  idleTimeout: 100000,

  suites: {
    testLearn: "filters1.spec.js",
  },
	// Spec patterns are relative to the current working directory when
	// protractor is called.
	//specs: ['header_expandbtn.spec.js','GlobalSearch.spec.js' ],
	// Options to be passed to Jasmine.
  jasmineNodeOpts: {
    showColors: false,
		//silent: true,
    defaultTimeoutInterval: 300000
  }
};
