/**
 * @jsx React.DOM
 */

Davis.$ = Zepto;

function draw(component, container) {
  React.renderComponent(
    component,
    container || document.getElementById('container')
  );
}

var app = Davis(function() {
  this.settings.generateRequestOnPageLoad = true;
  this.settings.handleRouteNotFound = true;

  this.bind("routeNotFound", function(r) {
    alert("routeNotFound: " + r.path);
    window.location = "/_utils"
  })

  this.bind("lookupRoute", function(req) {
    if (req.path.indexOf("/_utils") !== 0) {
      req.delegateToServer()
    }
  })

  // trim the path-prefix
  this.scope("/_utils", function() {

    /*  /_utils/
        The home page, list and create databases.
    */
    this.get('/', function (req) {
      draw(
        <PageWrap page="home">
          <p>Welcome to Couchbase Sync Gateway. You are connected to the admin port at <a href={location.toString()}>{location.toString()}</a></p>
          <AllDatabases title="Please select a database:"/>
          <p>Link to docs. Architecture diagram. cloud signup, downloads. Click here to install sample datasets: beerdb, todos, </p>
        </PageWrap>)
    })


    /*  /_utils/db/myDatabase
        /_utils/db/myDatabase/documents/myDocID
        The index page for myDatabase, list and edit documents.
    */
    function docIndex(req) {
          draw(
            <PageWrap db={req.params.db} page="documents">
              <DocumentsPage db={req.params.db} docID={req.params.id}/>
            </PageWrap>);
        }
    this.get('/db/:db', docIndex)
    // old: this.get('/db/:db/documents', docIndex)
    this.get('/db/:db/documents/:id', docIndex)


    /*  /_utils/db/myDatabase/sync
        Sync function editor for myDatabase
    */
    this.get('/db/:db/sync', function (req) {
      draw(
        <PageWrap db={req.params.db} page="sync">
          <SyncPage db={req.params.db}/>
        </PageWrap>);
    })


    this.get('/db/:db/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      draw(
        <PageWrap db={req.params.db} page="channels">
            <ChannelsWatchPage db={req.params.db} watch={watch} title={req.params.title}/>
        </PageWrap>);
    })
    this.get('/db/:db/channels/:id', function (req) {
      draw(
        <PageWrap db={req.params.db} page="channels">
          <ChannelInfoPage db={req.params.db} id={req.params.id}/>
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
    // todo this.get('/db/:db/users/:id/channels', userPage)
  })
});

