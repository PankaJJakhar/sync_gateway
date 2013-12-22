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
  var base = "/_utils/db/"+db
  if (path) {
    base += "/"+path
  }
  return base
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

this.bind("lookupRoute", function(req) {
  if (req.path.indexOf("/_utils") !== 0) {
    req.delegateToServer()
  }
})

// todo route /_utils/db/todos/users/jchris@gmail.com/channels
// for my channels in the channels view
  this.scope("/_utils", function() {
    this.get('/', function (req) {
      draw(<PageWrap page="home">
        <p>Welcome to the Couchbase Sync Gateway administrative interface for {location.origin}. Please select a database to begin.</p>
        </PageWrap>)
    })

    this.get('/db/:db', function (req) {
      draw(
        <PageWrap db={req.params.db} page="info">
          <DbInfoPage db={req.params.db}/>
        </PageWrap>);
    })

    function userPage(req) {
      draw(
        <PageWrap page="users" db={req.params.db}>
          <UsersPage db={req.params.db} userID={req.params.id}/>
        </PageWrap>);
    }

    this.get('/db/:db/users', userPage)
    this.get('/db/:db/users/:id', userPage)

    this.get('/db/:db/documents/:id', function (req) {
      draw(<PageWrap db={req.params.db} page="documents">
          <DocumentsPage db={req.params.db} docID={req.params.id}/>
        </PageWrap>);
    })

    this.get('/db/:db/documents', function (req) {
      draw(
        <PageWrap db={req.params.db} page="documents">
          <DocumentsPage db={req.params.db}/>
        </PageWrap>);
    })

    this.get('/db/:db/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      draw(
        <PageWrap db={req.params.db} page="channels">
            <ChannelsGridPage db={req.params.db} watch={watch} title={req.params.title}/>
        </PageWrap>);
    })

    this.get('/db/:db/channels/:id', function (req) {
      draw(
        <PageWrap db={req.params.db} page="channels">
          <ChannelInfoPage db={req.params.db} id={req.params.id}/>
        </PageWrap>);
    })
  })
});

