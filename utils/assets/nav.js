window.Nav = React.createClass({
  render : function() {
    var db = this.props.db;
    var page = this.props.page;
    return (
      /*jshint ignore:start */
      <div className="Nav">
      <a className="home" href="/_utils/">⌂</a>{" "}
      <a href={dbLink(db, "channels")}>Channels</a>{" "}
      <a href={dbLink(db, "users")}>Users</a>{" "}
      <a href={dbLink(db, "documents")}>Documents</a>{" "}
      <a href={dbLink(db, "documents")}>Config</a>
      </div>
      /*jshint ignore:end */
    );
  }
});
