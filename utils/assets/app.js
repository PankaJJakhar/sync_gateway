/**
 * @jsx React.DOM
 */

console.log("app.js")

Davis.$ = Zepto;

function dbLink(db, path) {
  return "/_utils/db/"+db+"/"+path;
}


window.Nav = React.createClass({
  render : function() {
    var db = this.props.db;
    var page = this.props.page;
    return (
      /*jshint ignore:start */
      <div>
      <a href={dbLink(db, "channels")}>Channels</a>{" "}
      <a href={dbLink(db, "users")}>Users</a>{" "}
      <a href={dbLink(db, "documents")}>Documents</a>{" "}
      <a href={dbLink(db, "documents")}>Config</a>
      </div>
      /*jshint ignore:end */
    );
  }
});

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
      React.renderComponent(
        <AllDatabases/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:name/users', function (req) {
      React.renderComponent(
        <UsersPage db={req.params.name}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:name/users/:user', function (req) {
      React.renderComponent(
        <UsersPage db={req.params.name} userID={req.params.user}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })

    this.get('/db/:name/channels', function (req) {
      var watch = (req.params.watch && req.params.watch.split(',') || []);
      console.log("watch", watch)
      React.renderComponent(
        <ChannelsPage db={req.params.name} watch={watch}/>, // jshint ignore:line
        document.getElementById('container')
      );
    })
  })
});

