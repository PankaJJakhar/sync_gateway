/**
 * @jsx React.DOM
 */

console.log("app.js")

Davis.$ = Zepto;

function dbLink(db, path) {
  return "/_utils/db/"+db+"/"+path;
}


var app = Davis(function() {
  this.settings.generateRequestOnPageLoad = true;
  this.settings.handleRouteNotFound = true;

  this.bind("routeNotFound", function(r) {
    console.error("routeNotFound", r.path);
    setTimeout(function(){
      window.location = "/_utils"
    }, 2000)
  })
// todo route /_utils/db/todos/users/jchris@gmail.com/channels
// for my channels in the channels view
  this.scope("/_utils", function() {
    this.get('/', function (req) {
      var pageParams = req.params;
      pageParams.sidebarList = AllDatabases();
      pageParams.page = "home";
      console.log("hom",pageParams)
      React.renderComponent(
        PageWrap(pageParams, <div>
          <h1>Hello.</h1>
          <p>Welcome to the Couchbase Sync Gateway administrative interface for {location.origin}. Please select a database to begin.</p>
        </div>),
        document.getElementById('container')
      );
    })

    this.get('/db/:db/users', function (req) {
      var content = <UsersPage db={req.params.db}/>
      React.renderComponent(
        <PageWrap page="users" params={req.params}>
          {content}
        </PageWrap>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/users/:id', function (req) {
      React.renderComponent(
        <PageWrap page="users" params={req.params}>
          <UsersPage db={req.params.db} userID={req.params.id}/>
        </PageWrap>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/documents/:id', function (req) {
      React.renderComponent(
        <PageWrap page="documents" params={req.params}>
          <DocumentsPage db={req.params.db} docID={req.params.id}/>
        </PageWrap>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/documents', function (req) {
      React.renderComponent(
        <PageWrap page="documents" params={req.params}>
          <DocumentsPage db={req.params.db}/>
        </PageWrap>,
        document.getElementById('container')
      );
    })

    this.get('/db/:db/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      React.renderComponent(
        <PageWrap page="channels" params={req.params}>
          <ChannelsPage db={req.params.db} watch={watch}/>
        </PageWrap>,
        document.getElementById('container')
      );
    })

    this.get('/db/:name/channels/:id', function (req) {
      React.renderComponent(
        <PageWrap page="channels" params={req.params}>
          <ChannelsPage db={req.params.name} channel={req.params.id}/>
        </PageWrap>,
        document.getElementById('container')
      );
    })
  })
});

