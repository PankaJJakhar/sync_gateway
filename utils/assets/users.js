/** @jsx React.DOM */


var sg = require("coax")(location.origin);

window.UsersPage = React.createClass({
  render : function() {
    var db = this.props.db;
    var userID = this.props.userID;
    console.log("render UsersPage")
    return (
      /*jshint ignore:start */
      <div>
      <UserInfo db={db} userID={userID}/>
      </div>
      /*jshint ignore:end */
    );
  }
});

var UserInfo = React.createClass({
  getInitialState: function() {
    return {user: {name : "", all_channels:[]}};
  },
  setStateForProps : function(props) {
    if (props.db && props.userID)
      sg.get([props.db, "_user", props.userID], function(err, data) {
        this.setState({user : data, userID : props.userID, db : props.db})
      }.bind(this))
    else
      this.setState(this.getInitialState())
  },
  componentWillReceiveProps: function(newProps) {
    // console.log("componentWillReceiveProps")
    this.setStateForProps(newProps)
  },
  componentWillMount: function() {
    // console.log("componentWillMount")
    this.setStateForProps(this.props)
  },
  render : function() {
    var user = this.state.user, userID = this.state.userID, db = this.state.db;
    return (
      /*jshint ignore:start */
      <div>
      <h2>{user.name}</h2>
      <h3><a href={dbLink(db,"channels?title=Channels for "+user.name+"&watch="+user.all_channels.join(','))}>Channels</a></h3>
      <ul>
{
  user.all_channels.map(function(ch){
    return <li>{ch}</li>
  })
}
      </ul>
      <h3>JSON User Document</h3>
      <pre><code>{JSON.stringify(user, null, 2)}</code></pre>
      <a href={dbLink(db, "_user/"+userID+"/edit")}>edit</a>
      </div>
      /*jshint ignore:end */
    );
  }
});

window.UsersForDatabase = React.createClass({
  getInitialState: function() {
    return {users: []};
  },
  componentWillMount: function() {
    var w = this;
    console.log("load ListUsers")
    sg.get([this.props.db, "_view", "principals"], function(err, data) {
      console.log("got", data)
      w.setState({users : data.rows})
    });
  },
  render : function() {
    var db = this.props.db;
    var users = this.state.users;
    /*jshint ignore:start */
    return (<ul className="ChannelList">
        {users.map(function(user) {
          return <li key={user.id}><a href={"/_utils/db/"+db+"/users/"+user.key}>{user.key}</a></li>;
        })}
      </ul>)
  }
})
