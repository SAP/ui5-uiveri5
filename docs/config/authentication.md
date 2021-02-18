# Authentication
To test a protected page, you need to specify authentication type and credentials. Authentication
is handled by plugable authenticator [modules](../src/moduleLoader.js). Basic (in URL), plain form, and form with UI5
authentication modules are already available. Each authenticator module accepts a number of parameters that could override the defaults.

By default, the authentication is performed before each spec file. If you want to do it only for the first spec, add the `authOnce` parameter:
```javascript
exports.config = {
  authOnce: true
}
```

## Authentication Configurations
To enable auth configuration, just configure it in the conf.js.
```javascript
auth: {
  // form based
  'sapcloud-form': {
      user: '<user>',
      pass: '<pass>'
  }
}
```

It is considered bad practice to leave credentials in the configs that may be saved in the source control system. 
The user and password parameters can be placeholders and the values can be passed from the command line.
```javascript
auth: {
  // form based
  'sapcloud-form': {
    user: '${params.user}',
    pass: '${params.pass}'
  }
}
```
To replace these placeholders, pass them in the command line:
```
uiveri5 --params.user=<user> --params.pass=<pass>
```

### Plain auth Configuration
This is the default authentication that is used whenever authentication is not configured explicitly.

### Basic auth Configuration
This configuration uses the `Basic-URL-Authenticator` authenticator and targets systems that use basic auth in the URL.

### Fiori-form auth Configuration
This configuration uses the `UI5-Form-Authenticator` authenticator and targets applications started from SAP Fiori Launchpad.

### Sapcp-form auth Configuration
This configuration uses the `Form-Authenticator` authenticator and targets applications behind SAP Cloud, SAP IDM or any other OAuth2.0 or plain form authentication. 

### Github-form auth Configuration
This configuration uses the `Form-Authenticator` authenticator and targets applications behind GitHub OAuth2.0 authentication and handles the authorize confirmation.

## Customize auth Configuration
It's possible to override an arbitrary authenticator parameter from the authentication configuration.
```javascript
auth: {
  'sapcloud-form': {
      name: './authenticator/formAuthenticator',
      userFieldSelector: '<CSS selector of user input field>',
      passFieldSelector: '<CSS selector of password input field>',
      user: '<user>',
      pass: '<pass>'
    }
}
```

## Authenticator Modules

### Plain Authneticator
This is a default authenticator that doesn't do any authentication. It is used by default whenever authentication is not configured.
Implemented in [plainAuthenticator.js](../../src/authenticator/plainAuthenticator.js).

### Basic URL Authenticator
This authenticator implements basic authentication by sending the user and password in the URL.
It uses the `baseUrl` as the host, and prepends the user and pass given in the configuration file:
```javascript
auth: {
	basic: {
		user: "<user>",
		pass: "<pass>"
	}
}
```
Implemented in [basicUrlAuthenticator.js](../../src/authenticator/basicUrlAuthenticator.js).

#### Parameters
* user - username 
* pass - password

### Form Authenticator
It supports browser redirects and does not require login page implemented with UI5.
Implemented in [formAuthenticator.js](../../src/authenticator/formAuthenticator.js).

#### Parameters
* user - username 
* pass - password
* userFieldSelector - the CSS selctor for the user input field
* passFieldSelector  - the CSS selector for the password input field
* logonButtonSelector - the CSS selector for the submit button
* conditionalLogonButtonSelector - indicates use of conditional authentication. Authentication is performed in several steps,
  as described in the [help portal](https://help.sap.com/viewer/6d6d63354d1242d185ab4830fc04feb1/Cloud/en-US/0143dce88a604533ab5ab17e639fec09.html?q=conditional%20authentication), In this case, `conditionalLogonButtonSelector` is the CSS
  selector for the first submit button and `logonButtonSelector` is the CSS selector for the second submit button.
* idpSelector - the CSS selector for the link to log in with a different ID provider
* frameSelector - if provided, the inoput fields are searched in this iFrame
* redirectUrl - if provided, it overides the basicUrl that is used to synchronize on page redirect that the identity provider
  initiates after successfull authentication. Request arguments and fragment are removed when matching, RegExp is supported.
* authorizationButtonSelector - the css selector of the authorize button
* authorizationButtonTimeout - authorize button appear timeout

Redirect to URLs that are matched with regex:
```javascript
auth: {
  'sapcloud-form': {
      user: '<user>',
      pass: '<pass>',
      redirectUrl: /console\/tenant\_/
    }
}
```

### UI5 Form Authenticator
This authenticator fills the user and password fields of a login form created with ui5 controls. It does not support redirections.
Implemented in [ui5FormAuthenticator.js](../../src/authenticator/ui5FormAuthenticator.js).

#### Parameters
* user - username 
* pass - password
* userFieldSelector - the CSS selctor for the user input field
* passFieldSelector  - the CSS selector for the password input field
* logonButtonSelector - the css selector for the submit button

### Custom Authenticator
If you have an application that uses a custom authentication scheme, you can implement a custom authenticator. You can use one of the existing authenticators as a base and extend it with the required behavior. Then, reference it in the `name` parameter of your auth configuration.
```javascript
var myAuthenticator = require.resolve('./src/myAuthenticator')

exports.config = {
  authConfigs: {
    'myauthconfig': {
      name: myAuthenticator,
      someField: 'someValue'
    }
  },
  auth: {
    'myauthconfig': {
      anotherField: '${params.anotherValue}',
    }
  }
};
```
If think your authenticator would be usefull for others, please consider contributing it by creating a pull request against this repo.

## Programatic Authentication
Set `baseUrl` to `null` to disable automatic page loading and declartive authentication configuration. From the test, call  `browser.get()` with the required URL. Note that `authOnce` isn't relevant for this case and will be ignored.

You can override the default auth settings by providing an options object with the same syntax as in the conf.js file. You can also supply creditentials from parameters but you need to use the programatic approach as the parameters placeholders are resolved only in the declarative configuration.
```javascript
browser.get(
  '<url>',{
    auth:{
      'sapcloud-form': {
        user: browser.testrunner.config.params.user,
        pass: browser.testrunner.config.params.pass
      }
    }
  }
);
```
