### General
Interceptors are used to inspect and manipulate the traffic between the browser that runs the application under
test and its backend.

#### Issues to solve
1. UI5 implicit waits require instrumentation code to be injected in the page before ui5 bootsrap is complete and the
application starts any activity. If application manages to start any activities like backend calls they will be missed by
ui5 instrumentation and page will be reported stale without accounting for such missed activities.
2. Chrome on windows requires a special registry setting to disable the "select certificate" popup for servers that use
SAP_CA root certificate.
Procedure: https://scn.sap.com/blogs/ivazharov/2013/10/22/how-to-automatically-select-sap-client-certificate-in-google-chrome
3. Internet Explorer does not respect user/pass provided in the page URL. There are workaround but they generally
require registry settings and are known to have issues in recent IE versions.
Procedure: https://support.microsoft.com/en-us/kb/834489

#### Operation
If interceptorProxyProvider is defined, an interceptorProxy instance is requested and started on page opening.
This proxy creates an http server that tunnels the connection over a chain of interceptors. Interceptor roughly
implements node http.request API. Then browser is driven with interceptor host:port/ and spec.contentUrl provided
as request param (or header - TBD). If last one is not https a default http interceptor is attached that simply
forward the request to remote host.

#### Available interceptors
1. ui5InstInterceptor
Used to inject the UI5 instrumentation that is the core of implicit waits. Works by inspecting the page source and if
detects ui5 boostrap on this page, inserts the ui5 instrumentation code. Solves issue 1.
2. authInterceptor
Supports basic authentication required by the server. Intercepts the opening page handshake and transparently executes
the basic authentication on behalf the browser. Solves issue 3.
3. httpsInterceptor
Used to handle https server authentication so automatically accepts any/SAP_CA root certificate when establishing the
connection. Solves issue 2

