/** @jsx React.DOM */


var coax = require("coax"), sg = coax(location.origin);

function hrefToggleWatchingChannel(db, chName, current) {
  var channels = [];
  var urlparts = current.split("?");
  var query = urlparts[1]
  if (query) {
    var parts = query.split("=")
    var watch = parts.indexOf("watch")
    if (watch !== -1) {
      channels = parts[watch+1].split(',');
    }
  }
  var chIndex = channels.indexOf(chName);
  if (chIndex == -1) {
    channels.push(chName)
  } else {
    channels.splice(chIndex, 1)
  }
  if (channels.length == 0) {
    return urlparts[0];
  } else {
    return dbLink(db, "channels?watch="+channels.join(','))
  }
}

window.ChannelInfoPage = React.createClass({
  getInitialState: function() {
    return {access: [], channel: {}, name : "", db : false};
  },
  setStateForProps : function(props) {
    console.log("setStateForProps", props)
    if (props.db && props.id) {
      sg.get([props.db, "_view", "access"], function(err, data) {
        var usersForChannel = [];
        data.rows.forEach(function(r) {
          if (r.value[props.id]) {
            usersForChannel.push(r)
          }
        });
        console.log("usersForChannel", usersForChannel)

        var watcher = channelWatcher(props.db)
        watcher.onChange("ChannelsGridPage", function(change) {
          this.setState({
            channel : watcher.channels([props.id])[0],
            access : usersForChannel,
            name : props.id,
            db : props.db})
        }.bind(this))

      }.bind(this))
    } else {
      this.setState(this.getInitialState())
    }
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
    var name = this.state.name;
    var db = this.state.db;
    if (!(name && db)) return <div/>;
    var access = this.state.access && this.state.access.map(function(row){
      return <li><a href={dbLink(db, "users/"+row.key)}>{row.key}</a>
        : <a href={dbLink(db, "documents/"+row.id)}>{row.id}</a></li>
    });
    console.log("ChannelsPage",access)
    /*jshint ignore:start */
    return (
      <div>
        <h2>Channel Info: {name}</h2>
        <div className="channelDocs">
          <h3>Recent Updates</h3>
          <ChangeList channel={this.state.channel} db={db}></ChangeList>
        </div>
        <div className="channelAccess">
        <h3>Access Control: Readers</h3>
        {access && <ul>{access}</ul>}
        </div>
      </div>
      )
    /*jshint ignore:end */
  }
})

window.ChannelsGridPage = React.createClass({
  getInitialState: function() {
    return {channels: [], db : this.props.db};
  },
  setStateForProps: function(props) {
    var watcher = channelWatcher(props.db)
    console.log("componentWillMount ChannelsGridPage", props, watcher)
    watcher.onChange("ChannelsGridPage", function(change) {
      this.setState({
        channels : watcher.channels(props.watch),
        db : props.db
      })
    }.bind(this))
  },
  componentWillReceiveProps: function(newProps) {
    // console.log("componentWillReceiveProps")
    this.setStateForProps(newProps)
  },
  componentWillMount: function() {
    // console.log("componentWillMount")
    this.setStateForProps(this.props)
  },
  render : function(){
    var channels = this.state.channels;
    var db = this.state.db,
      title = this.props.title || "Watch Channels";
    return (
      <div className="ChannelGrid">
      <h2>{title}</h2>
      <RecentChannels db={db} watch={this.props.watch}/>
      <ul>
      {channels.map(function(ch){
        return <li><ChangeList channel={ch} db={db}></ChangeList></li>
      })}
      </ul>
      </div>
    )

  }
})

var ChangeList = React.createClass({
  render : function() {
    var channel = this.props.channel;
    var db = this.props.db;
    console.log("ChangeList", channel)
    return (
      <div className="ChangeList">
      <a className="watched" href={dbLink(db, "channels/"+channel.name)}>{channel.name}</a>
      {!channel.access && " (no access grants)"}
    <ul>
      {channel.changes.map(function(ch){
        var isAccess = channel.access && channel.access[ch[0]] && "isAccess";
        return <li className={isAccess}>{ch[1]} : <a href={dbLink(db, "documents/"+ch[0])}>{ch[0]}</a></li>
      })}
    </ul></div>
          );
  }});




window.RecentChannels = React.createClass({
  getInitialState: function() {
    return {channelNames: [], db : this.props.db};
  },
  componentWillMount: function() {
    var watcher = channelWatcher(this.props.db)
    console.log("componentWillMount RecentChannels", this.props, watcher)
    watcher.onChange("RecentChannels", function(change) {
      this.setState({
        channelNames : watcher.channelNames(),
        db : this.props.db
      })
    }.bind(this))
  },
  render : function() {
    var watch = this.props.watch || [],
      currentLoc = location.toString();
    /*jshint ignore:start */
    return (<div className="RecentChannels">
      <strong>{this.state.channelNames.length} channels</strong>.
      Select channels to watch updates.
      <ul>
      {this.state.channelNames.map(function(ch) {
        var isWatched = watch.indexOf(ch) !== -1
        return <li key={ch+isWatched}>
          <a className={isWatched && "watched"} href={hrefToggleWatchingChannel(this.state.db, ch, currentLoc)}>
            {ch}
          </a>
          </li>;
      }.bind(this))}
    </ul></div>)
    /*jshint ignore:end */
  }
});
