# Usage sample

1. First create sample Java application following [this](https://developers.sap.com/tutorials/hcp-java-basic-app.html) tutorial and make sure that on the last step of Create new project wizard you will select "Generate web.xml deployment descriptor" checkbox. It is not described in the tutorial, but is important.
2. Verify that your application is deployed on SCP and can be loaded in the browser.
3. Modify your application to make authenticated GET requests to the servlet.
  * Open the servlet and replace the code in doGet method with:
  ````java
      response.setContentType("application/json");
      String user = request.getRemoteUser();
      if (user != null) {
        response.getWriter().print("{\"user\": \"Hello, " + user + "\"}");
      } else {
        LoginContext loginContext;
        try {
          loginContext = LoginContextFactory.createLoginContext("BASIC");
          loginContext.login();
          response.getWriter().print("{\"user\": \"Hello, " + request.getRemoteUser() + "\"}");

        } catch (LoginException e) {
          e.printStackTrace();
        }
      }
  ````
  * Go to your SCP account -> Java Applications -> <Your App>
  * In the left side bar expand Security section and select Authentication Configuration
  * Verify that it uses the `Default Configuration`. If not - activate it, save and restart your application.
  * Test the security configuration - call your servlet without providing authentication and verify that the access is denied. Then call again and provide authentication - credentials for SCP.
4. Add SAPUI5 frontend to you Java application
  * In you Java project create file `index.html` in the WebContent folder, then paste this code:
  ````HTML
  <!DOCTYPE html>
  <html>
  <head>
  	<meta http-equiv="X-UA-Compatible" content="IE=edge">
  	<meta charset="utf-8">
  	<title>Hello World App</title>
  	<script src="https://sapui5.hana.ondemand.com/sdk/resources/sap-ui-core.js"
  		id="sap-ui-bootstrap"
  		data-sap-ui-theme="sap_bluecrystal"
  		data-sap-ui-libs="sap.m">
  	</script>
  	<script type="text/javascript">
  		sap.ui.getCore().attachInit(function () {
  			// create a mobile app and display page1 initially
  			var app = new sap.m.App("myApp", {
  				initialPage: "page1"
  			});
  			// create the first page
  			var page1 = new sap.m.Page("page1", {
  				title : "Hello World",
  				showNavButton : false,
  				content : new sap.m.Button({
  					text : "Go to Page 2",
  					press : function () {
  						// navigate to page2
  						app.to("page2");
  					}
  				})
  			});
  			// create the second page with a back button
  			var page2 = new sap.m.Page("page2", {
  				title : "Hello Page 2",
  				showNavButton : true,
  				navButtonPress : function () {
  					// go back to the previous page
  					app.back();
  				}
  			});
  			// add both pages to the app
  			app.addPage(page1).addPage(page2);
  			// place the app into the HTML document
  			app.placeAt("content");
  		});
  	</script>
  </head>
  <body class="sapUiBody" id="content">
  </body>
  </html>
  ````
  5. Redeploy

### In this folder you can find sample uiveri5 test which demonstrates API testing capabilities.
### How to run it:
* Execute it like regular uiveri5 test and provide 3 params:
1. --param.user=<your-scp-user>
2. --params.pass=<your-scp-pass>
3. --params.apiURL=<your-servlet-url>
