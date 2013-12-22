/** @jsx React.DOM */


var sg = require("coax")(location.origin);

window.DocumentsPage = React.createClass({
  render : function() {
    var db = this.props.db;
    var docID = this.props.docID;
    return (
      /*jshint ignore:start */
      <div>
      <DocInfo db={db} docID={docID}/>
      </div>
      /*jshint ignore:end */
    );
  }
});


var ListDocs = React.createClass({
  getInitialState: function() {
    return {docs: []};
  },
  componentWillMount: function() {
    console.log("load ListDocs")
    sg.get([this.props.db, "_view", "channels",
      {start_key : ["*"], end_key : ["*", {}]}], function(err, data) {
      console.log("got", data)
      this.setState({docs : data.rows})
    }.bind(this));
  },
  render : function() {
    var db = this.props.db;
    var docs = this.state.docs;
    /*jshint ignore:start */
    return (<ul className="sidebar">
        {docs.map(function(doc) {
          return <li><a href={dbLink(db, "documents/"+doc.id)}>{doc.key}</a></li>;
        })}
      </ul>)
  }
})

var JSONDoc = React.createClass({
  render : function() {
    return <div className="JSONDoc">
    <h3>JSON Data</h3>

      <pre><code>
      {JSON.stringify(this.props.doc, null, 2)}
      </code></pre>
    </div>;
  }
})

function channelLink(db, channel) {
  return <a href={dbLink(db,"channels/"+channel)}>{channel}</a>
}

function userLink(db, user) {
  return <a href={dbLink(db,"users/"+user)}>{user}</a>
}

var DocSyncPreview = React.createClass({
  render : function() {
    var sync = this.props.sync;
    var db = this.props.db;
    var channels = Object.keys(sync.channels);
    var access = {};
    for (var user in sync.access) {
      var chans = Object.keys(sync.access[user])
      chans.forEach(function(ch){
        access[ch] = access[ch] || {}
        access[ch][user] = true;
      })
    }
    var accessList = []
    for (var ch in access) {
      accessList.push([ch,Object.keys(access[ch])])
    }
    return <div className="DocSyncPreview">
    <h3>Sync Output</h3>
      <dl>
      <dt>Channels</dt>
      {channels.map(function(ch) {
        return <dd>{channelLink(db, ch)}</dd>
      })}
      <dt>Access</dt>
      {accessList.map(function(ch) {
        return <dd>{channelLink(db, ch[0])}<dl>
          {ch[1].map(function(who){
                  return <dd>{userLink(db, who)}</dd>
                })}</dl></dd>
      })}
      </dl>
    </div>;
    }
})

var clear = <br className="clear"/>

window.DocInfo = React.createClass({
  getInitialState: function() {
    return {doc: {}, sync : {channels:{}, access:{}},docID : "", db : false};
  },
  setStateForProps : function(props) {
    console.log("setStateForProps", props)
    if (props.db && props.docID) {
      sg.get([props.db, "_raw", props.docID], function(err, data) {
        var sync = data._sync;
        delete data._sync;
        this.setState({doc : data, sync: sync, docID : props.docID, db : props.db})
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
    console.log("DocInfo", this.state)
    var doc = this.state.doc, docID = this.state.docID, db = this.state.db;
    return (
      /*jshint ignore:start */
      <div className="DocInfo">
        <h2>Document: {docID}</h2>
        <JSONDoc doc={doc} id={docID}/>
        <DocSyncPreview db={db} sync={this.state.sync} id={docID}/>
        {clear}
      </div>
      /*jshint ignore:end */
    );
  }
});

