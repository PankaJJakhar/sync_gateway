/** @jsx React.DOM */


var coax = require("coax"), sg = coax(location.origin);

window.ChannelsPage = React.createClass({
  render : function() {
    var content, db = this.props.db;
    if (this.props.channel) {
      content = <ChannelInfo db={db} name={this.props.channel}/>
    } else {
      content = <RecentChannels db={db} watch={this.props.watch} />
    }
    return (
      /*jshint ignore:start */
      <div>
      <h2>Database: {db}</h2>
      {content}
      </div>
      /*jshint ignore:end */
    );
  }
});

function hrefToggleWatchingChannel(chName, current) {
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
    return urlparts[0] + "?watch="+channels.join(',')
  }
}

var ChannelInfo = React.createClass({
  getInitialState: function() {
    return {access: [] ,name : "", db : false};
  },
  setStateForProps : function(props) {
    console.log("setStateForProps", props)
    if (props.db && props.name) {
      sg.get([props.db, "_view", "access"], function(err, data) {
        var usersForChannel = [];
        data.rows.forEach(function(r) {
          if (r.value[props.name]) {
            usersForChannel.push(r)
          }
        });
        this.setState({access : usersForChannel, name : props.name, db : props.db})
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
    var access = this.state.access && this.state.access.map(function(row){
      return <li><a href={dbLink(db, "users/"+row.key)}>{row.key}</a>
        : <a href={dbLink(db, "documents/"+row.id)}>{row.id}</a></li>
    });
    console.log(access)
    /*jshint ignore:start */
    return (
      <div>
        <h2>Channel Info: {name}</h2>
        <h3>Access Control: Readers</h3>
        {access && <ul>{access}</ul>}
        {
          (db && name) &&
            <iframe width="75%" height="400px" src={"/"+db+"/_dumpchannel/"+name}></iframe>
        }
      </div>
      )
    /*jshint ignore:end */
  }
})

var ChannelList = React.createClass({
  render : function() {
    var channels = this.props.channels;
    var watched = this.props.watch;
    var currentLoc = location.toString();
    /*jshint ignore:start */
    return (<ul className="sidebar">
        {channels.map(function(ch) {
          var watchClass = watched.indexOf(ch) !== -1 ? "watched" : "";
          return <li key={ch} className={watchClass}><a href={hrefToggleWatchingChannel(ch, currentLoc)}>{ch}</a></li>;
        })}
        </ul>)
    /*jshint ignore:end */

  }
});

var ChannelGridHeaders = React.createClass({
  render : function() {
    var channels = this.props.channels;
    var db = this.props.db;
    return (
    <tr>
      {channels.map(function(ch){
        return <th><a href={dbLink(db, "channels/"+ch.name)}>{ch.name}</a></th>
      })}
    </tr>
          );
  }});

var ChannelGrid = React.createClass({
  render : function() {
    var channels = this.props.channels;
    var docLists = {};

    channels.forEach(function(ch){
      docLists[ch.name] = []

      var revs ={}, docs = ch.docs;
      for (var id in docs)
        revs[docs[id]] = id
      var rs = Object.keys(revs).sort(function(a, b){
        return parseInt(a) - parseInt(b);
      });
      for (var i = 0; i <= rs.length; i++) {
      // for (var i = rs.length - 1; i >= 0; i--) {
        var docid = revs[rs[i]];
        docLists[ch.name].push([docid, rs[i]])
      };
    })
    var done = Array.apply(null, new Array(channels.length)).map(function(){return 0  }), rows = [];
// todo you can add a limit here
    while (done.indexOf(0) !== -1) {
      var row = new Array(channels.length);
      for (var i = channels.length - 1; i >= 0; i--) {
        var chNext = docLists[channels[i].name].pop();
        if (!chNext) {
          done[i] = 1
          row[i] = false
        } else {
          row[i] = chNext
        }
      };
      rows.push(row);
    }
    var db = this.props.db;
    return (
      <div className="ChannelGrid">
      <table>
        <ChannelGridHeaders db={db} channels={channels}/>
        {rows.map(function(row){
          return <tr>
            {row.map(function(id) {
              return <ChangeCell id={id[0]} seq={id[1]} db={db}/>
            })}
          </tr>
        })}
      </table>
      </div>
    )
  }});


var ChangeCell = React.createClass({
  render : function() {
    if (this.props.seq && this.props.id && this.props.db) {
      return <td>{this.props.seq} : <a href={dbLink(this.props.db, "documents/"+this.props.id)}>{this.props.id}</a></td>
    } else {
      return <td/>
    }
  }
})

window.RecentChannels = React.createClass({
  watchChannels : function() {
    var w = this;
    sg.get([w.props.db, "_view", "channels"], function(err, data) {
      // console.log("data", data)
      var ch, max = 0, keys = {}, rows = data.rows;
      for (var i = 0; i < rows.length; i++) {
        ch = rows[i].key[0];
        keys[ch] = keys[ch] || {};
        keys[ch][rows[i].id] = rows[i].key[1];
        if (rows[i].key[1] > max) max = rows[i].key[1];
      };
      // console.log("channels", keys)
      w.setState({channels: keys});
      w.refreshChannelWatcher(max);
    });
  },
  refreshChannelWatcher : function(max) {
    // Object.keys(this.state.channels);
    if (this.changes) {
      console.log("already watching")
      return;
    }
    // console.log(max)
    var opts = {};

    opts.filter = "sync_gateway/bychannel";
    opts.channels = this.props.watch.join(',')
    opts.since = "*:"+(max-1)
    var w = this;

var oldSeq = {};
function parseSeq(seq) {
  var chs = seq.split(',');
  var seqObj = {};
  for (var i = chs.length - 1; i >= 0; i--) {
    var ps = chs[i].split(":"),
      name = ps[0],
      num = parseInt(ps[1])
    seqObj[name] = num;
  };
  var output = {};
  for (var k in oldSeq) {
    if (!seqObj[k]) {
      output[k] = seqObj[k];
    } else if (seqObj[k] && seqObj[k] !== oldSeq[k]) {
      output[k] = seqObj[k];
    }
  }
  oldSeq = seqObj;
  return output;
}
console.log("change opts", opts)
    this.changes = coax([location.origin, this.props.db]).changes(opts, function(err, change) {
      console.log("change", err, change)
      var channels = w.state.channels;
      var seq = parseSeq(change.seq)
      var changed = false
      console.log("before change", seq, change)
// detect which channel got a new num in the seq feed...
      for (var ch in seq) {
        if (!channels[ch]) {
          console.log("ignore", change)
          continue;
          // channels[ch] = {}
        }
        channels[ch][change.id] = seq[ch]
        changed = true
        console.log("changed", ch, change.id, seq[ch])
      }
      // console.log("after change", JSON.stringify(channels))
      if (changed) w.setState({channels:channels})
    })

  },
  getInitialState: function() {
    return {channels: {}};
  },
  componentWillMount: function() {
    console.log("load recent channels")
    this.watchChannels();
  },
  render : function() {
    var w = this;
    // console.log(this.props)
    // fish props out of URL?
    var db = this.props.db,
      channels = this.state.channels,
      channelNames = Object.keys(this.state.channels),

      watchedChannels = this.props.watch && this.props.watch.map(function(ch){
        return {name : ch, docs : w.state.channels[ch]}
      });
    return (
      /*jshint ignore:start */
      <div>
      <h3>Channels</h3>
      <ChannelList channels={channelNames} watch={this.props.watch}/>
      <ChannelGrid db={this.props.db} channels={watchedChannels}/>
      </div>
      /*jshint ignore:end */
    );
  }
});
