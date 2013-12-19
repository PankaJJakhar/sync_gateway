/** @jsx React.DOM */


var coax = require("coax"), sg = coax(location.origin);

window.ChannelsPage = React.createClass({
  render : function() {
    var db = this.props.db;
    return (
      /*jshint ignore:start */
      <div>
      <a href="/_utils/">home</a>
      <Nav db={db} page="channels"/>
      <h2>Database: {db}</h2>
      <RecentChannels db={db} watch={this.props.watch} />
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
    console.log('x',query, parts)
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

var ChannelList = React.createClass({
  render : function() {
    var channels = this.props.channels;
    var watched = this.props.watch;
    var currentLoc = location.toString();
    /*jshint ignore:start */
    return (<ul className="ChannelList">
        {channels.map(function(ch) {
          var watchClass = watched.indexOf(ch) !== -1 ? "watched" : "";
          return <li key={ch} className={watchClass}><a href={hrefToggleWatchingChannel(ch, currentLoc)}>{ch}</a></li>;
        })}
        </ul>)
    /*jshint ignore:end */

  }
});

var DocsInChannel = React.createClass({
  render : function() {
    var ids = this.props.ids, docs = this.props.docs;
    return (
      <ul className="DocsInChannel">
        {ids.map(function(id){
          return <li key={id}>{docs[id]}{" "}{id}</li>;
        })}
      </ul>
      );
  }})

var ChannelGridColumn = React.createClass({
  render : function() {
    var ch = this.props.channel;
    var revs ={}, docs = ch.docs;
    for (var id in docs)
      revs[docs[id]] = id
    var rs = Object.keys(revs).sort(function(a, b){
      return parseInt(a) - parseInt(b);
    });
    var docList = [];
    for (var i = rs.length - 1; i >= 0; i--) {
      var docid = revs[rs[i]];
      docList.push(docid)
    };
    return (
      <div className="ChannelGridColumn">
      <h3>Channel {ch.name}</h3>
      <DocsInChannel ids={docList} docs={docs}/>
      </div>
      );
}});

var ChannelGridHeaders = React.createClass({
  render : function() {
    var channels = this.props.channels;

    return (
    <tr>
      {channels.map(function(ch){
        return <th>{ch.name}</th>
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
      for (var i = rs.length - 1; i >= 0; i--) {
        var docid = revs[rs[i]];
        docLists[ch.name].push(docid)
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

    return (
      <div className="ChannelGrid">
      <table>
        <ChannelGridHeaders channels={channels}/>
        {rows.map(function(row){
          return <tr>
            {row.map(function(id) {
              return <td>{id}</td>
            })}
          </tr>
        })}
      </table>
      </div>
    )
  }});


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

    this.changes = coax([location.origin, this.props.db]).changes(opts, function(err, change) {
      console.log("change", err, change)
      var channels = w.state.channels;
      var seq = parseSeq(change.seq)
      var changed = false
      // console.log("before change", num, change.id, JSON.stringify(channels))
// detect which channel got a new num in the seq feed...
      for (var ch in seq) {
        if (!channels[ch]) {
          channels[ch] = {}
          changed = true
        }
        if (channels[ch][change.id]) {
          // console.log("old", channels[ch][change.id], ch, seq[ch], change.id)
          changed = true
          channels[ch][change.id] = seq[ch]
        }
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
      <ChannelGrid channels={watchedChannels}/>
      </div>
      /*jshint ignore:end */
    );
  }
});
