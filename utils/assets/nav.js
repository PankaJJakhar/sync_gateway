/** @jsx React.DOM */


var NavBar = React.createClass({
  render : function() {
    console.log("NavBar", this.props)

    var db = this.props.db;
    if (!db) return <div/>;

    return (<div className="NavBar">
          <a href={dbLink(db, "channels")}>Channels</a>{" "}
          <a href={dbLink(db, "users")}>Users</a>{" "}
          <a href={dbLink(db, "documents")}>Config</a>
        </div>);
  }
})



var SidebarList =  React.createClass({
  // needs to maintain breadcrumbs state, render breadcrumbs for state
  render : function() {
    var name = this.props.page + (this.props.db||"");
    console.log("SidebarList", this.props)
    return <div className="SidebarList">
      <Breadcrumbs params={this.props.params}/>
      This should update for which page you are on.
      {this.props.sidebarList}
    </div>;
  }
});
var Breadcrumbs =  React.createClass({
  render : function() {
    return <div className="Breadcrumbs"><a href="/_utils/">home</a></div>
  }
});


window.PageWrap = React.createClass({
  render : function() {
    console.log("PageWrap", this.props)
    if (!this.props.params) this.props.params = {};
    var sidebarList= this.transferPropsTo(<SidebarList />)
    return (
      /*jshint ignore:start */
      <div className="page">
        <div id="sidebar">
          <a id="logo" href="/_utils/"><img src="/_utils/assets/logo.png"/></a>
          {sidebarList}
        </div>
        <div id="main">
          <div className="content">
            <NavBar db={this.props.params.db}/>
            {this.props.children}
          </div>
        </div>
      </div>
      /*jshint ignore:end */
    );
  }
});
