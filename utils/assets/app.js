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
  document.getElementById('sidebarDbPageNav')
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
      var content = <UsersPage db={req.params.db}/>

      React.renderComponent(
        <DbPageNav page="users" params={req.params}>

        </DbPageNav>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/users/:id', function (req) {
      React.renderComponent(
        <DbPageNav page="users" params={req.params}>
          <UsersPage db={req.params.db} userID={req.params.id}/>
        </DbPageNav>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/documents/:id', function (req) {
      React.renderComponent(
        <DbPageNav page="documents" params={req.params}>
          <DocumentsPage db={req.params.db} docID={req.params.id}/>
        </DbPageNav>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/documents', function (req) {
      React.renderComponent(
        <DbPageNav page="documents" params={req.params}>
          <DocumentsPage db={req.params.db}/>
        </DbPageNav>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      React.renderComponent(
        <DbPageNav page="channels" params={req.params}>
          <ChannelsPage db={req.params.db} watch={watch}/>
        </DbPageNav>,
        document.getElementById('container')
      );
    })

    this.get('/db/:name/channels/:id', function (req) {
      React.renderComponent(
        <DbPageNav page="channels" params={req.params}>
          <ChannelsPage db={req.params.name} channel={req.params.id}/>
        </DbPageNav>,
        document.getElementById('container')
      );
    })
  })
});

