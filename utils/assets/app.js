/**
 * @jsx React.DOM
 */

console.log("app.js")

Davis.$ = Zepto;

function dbLink(db, path) {
  return "/_utils/db/"+db+"/"+path;
}

// setup sidebar
React.renderComponent(
  <AllDatabases/>, // jshint ignore:line
  document.getElementById('sidebarNav')
);

var app = Davis(function() {
  this.settings.generateRequestOnPageLoad = true;
  this.settings.handleRouteNotFound = true;

  this.bind("routeNotFound", function(r) {
    console.error("routeNotFound", r.path);
    setTimeout(function(){
      window.location = "/_utils"
    }, 2000)
  })

  this.scope("/_utils", function() {
    this.get('/', function (req) {
      React.renderComponent(<div><h1>Hello.</h1></div>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/users', function (req) {
      React.renderComponent(
        <UsersPage db={req.params.db}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:db/users/:user', function (req) {
      React.renderComponent(
        <UsersPage db={req.params.db} userID={req.params.user}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:db/documents/:id', function (req) {
      React.renderComponent(
        <DocumentsPage db={req.params.db} docID={req.params.id}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:db/documents', function (req) {
      React.renderComponent(
        <DocumentsPage db={req.params.db}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:db/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      console.log("watch", watch)
      React.renderComponent(
        <ChannelsPage db={req.params.db} watch={watch}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:name/channels/:id', function (req) {
      React.renderComponent(
        <ChannelsPage db={req.params.name} channel={req.params.id}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })
  })
});

