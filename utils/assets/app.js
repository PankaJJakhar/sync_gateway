/**
 * @jsx React.DOM
 */

console.log("app.js")

Davis.$ = Zepto;

function draw(component, container) {
  React.renderComponent(
    component,
    container || document.getElementById('container')
  );
}

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
      draw(<PageWrap page="home" sidebar={<AllDatabases/>}>
        <h1>Hello.</h1>
        <p>Welcome to the Couchbase Sync Gateway administrative interface for {location.origin}. Please select a database to begin.</p>
        </PageWrap>)
    })

    function userPage(req) {
      draw(<PageWrap page="users" db={req.params.db}
        sidebar={<UsersForDatabase db={req.params.db}/>}>
        <UsersPage db={req.params.db} userID={req.params.id}/>
        </PageWrap>);
    }

    this.get('/db/:db/users', userPage)
    this.get('/db/:db/users/:id', userPage)

    this.get('/db/:db/documents/:id', function (req) {
      draw(<PageWrap db={req.params.db} page="documents" params={req.params}>
          <DocumentsPage db={req.params.db} docID={req.params.id}/>
        </PageWrap>);
    })

    this.get('/db/:db/documents', function (req) {
      draw(
        <PageWrap db={req.params.db} page="documents" params={req.params}>
          <DocumentsPage db={req.params.db}/>
        </PageWrap>);
    })

    this.get('/db/:db/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      draw(
        <PageWrap db={req.params.db} page="channels" params={req.params}
          sidebar={<RecentChannels db={req.params.db} watch={watch}/>}>
            <ChannelsPage db={req.params.db} watch={watch}/>
        </PageWrap>);
    })

    this.get('/db/:name/channels/:id', function (req) {
      draw(
        <PageWrap db={req.params.db} page="channels" params={req.params}>
          <ChannelsPage db={req.params.name} channel={req.params.id}/>
        </PageWrap>);
    })
  })
});

