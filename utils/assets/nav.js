/** @jsx React.DOM */

var NavBar = React.createClass({
  render : function() {
    console.log("NavBar", this.props)
    var page = this.props.page;
    var db = this.props.db;
    if (!db) return <div className="NavBarWrap">
      <div className="NavBar">
        <a className="logo" href="/_utils/">
          <img src="/_utils/assets/logo.png"/>
        </a>{" "}
        <strong>Hello.</strong>
      </div>
    </div>;

    return (<div className="NavBarWrap"><div className="NavBar">
          <a className="logo" href="/_utils/">
            <img src="/_utils/assets/logo.png"/>
          </a>{" "}
          <strong>{db}</strong>{" > "}
          <a className={page == "info" && "active"}
            href={dbLink(db)}>Sync</a>{" : "}
          <a className={page == "channels" && "active"}
            href={dbLink(db, "channels")}>Channels</a>{" : "}
          <a className={page == "users" && "active"}
            href={dbLink(db, "users")}>Users</a>
        </div></div>);
  }
})

// <div id="sidebar">
//   <a id="logo" href="/_utils/"><img src="/_utils/assets/logo.png"/></a>
//   <div className="sideNav"></div>
// </div>
window.PageWrap = React.createClass({
  render : function() {
    return (
      /*jshint ignore:start */
      <div className="page">
        <div id="main">
          <div className="content">
            <NavBar db={this.props.db} page={this.props.page}/>
            {this.props.children}
          </div>
        </div>
      </div>
      /*jshint ignore:end */
    );
  }
});
