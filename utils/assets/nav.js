/** @jsx React.DOM */

// rename to DatabaseDbPageNav
window.DbPageNav = React.createClass({
  render : function() {
    console.log("DbPageNav", this.props.params)
    if (!this.props.params) return <div/>;
    var db = this.props.params.db;
    return (
      /*jshint ignore:start */
      <div className="page">
      <div className="DbPageNav">
      <a className="home" href="/_utils/">⌂</a>{" "}
      <a href={dbLink(db, "channels")}>Channels</a>{" "}
      <a href={dbLink(db, "users")}>Users</a>{" "}
      <a href={dbLink(db, "documents")}>Documents</a>{" "}
      <a href={dbLink(db, "documents")}>Config</a>
      </div>
      {this.props.children}
      </div>
      /*jshint ignore:end */
    );
  }
});
