# Authentication
To test a protected page you need to specify authentication type and credentials in config. Authentication
is handled by plugable authenticator [modules](../src/moduleLoader.js). Basic(in URL), plain form and form with UI5
authentication modules are alredy available. Each authenticator module accepts a number of parameters that could override the defaults.

## Authentication configurations
To enable auth configuration, just configure it in the conf.js
```javascript
auth: {
  // form based
  'sapcloud-form': {
      user: '<user>',
      pass: '<pass>'
  }
}
```

It is bad practice to leave credentials in the configs, which may be saved in source control system. 
The user and pass parameters can be placeholders and the values can be passed from the command line.
```javascript
auth: {
  // form based
  'fiori-form': {
    user: '${params.user}',
    pass: '${params.pass}'
  }
}
```
To replace these placeholders you may pass them in the command line:
```
uiveri5 --params.user=<user> --params.pass=<pass>
```

### Plain auth configuration
This is the default authentication that is used whenever authentication is not configured explicitly.

### Basic auth configuration
This configuration uses the [#Basic-URL-Authenticator] and targets systems that use basic auth in URL.

### Fiori-form auth configuration
This configuration uses the [#UI5-Form-Authenticator] and targets applications started from Fiori Launchpad.

### Sapcp-form auth configuration
This configuration uses the [#Form-Authenticator] and targets applications behind SAP Cloud, SAP IDM or any other OAuth2.0 or plain form authentication. 

## Customize auth configuration
It possible to override an arbitrary authenticator parameter from the authentication configuration
```javascript
auth: {
  'sapcloud-form': {
      name: './authenticator/formAuthenticator',
      userFieldSelector: '<CSS selector of user input field>',
      passFieldSelector: '<CSS selector of password input field>',
      logonButtonSelector: '<CSS selector of submit button>',
      user: '<user>',
      pass: '<pass>'
    }
}
```

## Authentication modules

### Plain authneticator
This is a default authenticator that does not do any authentication. It is used by default whenever authentication is not configured.
Implemented in [../src/authenticator/plainUrlAuthenticator.js]

### Basic URL Authenticator
It send the user and password in the url.
Implemented in [../src/authenticator/basicUrlAuthenticator.js]

#### Parameters
* user - username 
* pass - password

### Form Authenticator
It supports browser redirects and does not require login page implemented with UI5.
Implemented in [../src/authenticator/ui5FormAuthenticator.js]

#### Parameters
* user - username 
* pass - password
* userFieldSelector - the CSS selctor for the user input field
* passFieldSelector  - the CSS selector for the password input field
* logonButtonSelector - the css selector for the submit button
* frameSelector - if provided, the inoput fields will be searched in this iFrame.
* redirectUrl - if provided, will overide basicUrl that is used to synchronize on page redirect that the identitty provider will initiate after successfull authentication. Request arguments and fragment are removed when matching, regexp is supported.

Redirect to urls that are matched with regex:
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
Implemented in [../src/authenticator/formAuthenticator.js]

#### Parameters
* user - username 
* pass - password
* userFieldSelector - the CSS selctor for the user input field
* passFieldSelector  - the CSS selector for the password input field
* logonButtonSelector - the css selector for the submit button

### Custom Authenticator
If you face an application that uses a custom authentication scheme, you could implement a custom authenticator. You can use one of the existing authenticators as a base and extend it with required behaviour. Then reference it in the 'name' parameter of your auth configuration.
If you feel your autenticator will have wider usage, please consider contributing it by creating a PR against this repo.

## Programatic authentication
Set 'baseUrl' to 'null' to disable automatic page loading and declartive authentication configuration. Then call navigation.to() with required URL from your test.
You could override the default auth settings by providing an options object with the same syntax as in conf.js
```javascript
browser.testrunner.navigation.to(
  '<url>',{
    auth:{
      'sapcloud-form': {
        user: '<user>',
        pass: '<pass>'
      }
    }
  }
);
```
