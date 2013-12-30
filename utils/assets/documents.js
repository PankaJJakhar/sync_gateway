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

window.JSONDoc = React.createClass({
  render : function() {
    return <div className="JSONDoc">
      <h4>{this.props.id||"Loading..."}</h4>
      <pre><code>
      {JSON.stringify(this.props.doc, null, 2)}
      </code></pre>
    </div>;
  }
})

function channelLink(db, channel) {
  return <a href={dbLink(db,"channels/"+channel)}>{channel}</a>
}

function docLink(db, id) {
  return <a href={dbLink(db,"documents/"+id)}>{id}</a>
}

function userLink(db, user) {
  return <a href={dbLink(db,"users/"+user)}>{user}</a>
}

window.DocSyncPreview = React.createClass({
  getDefaultProps : function(){
    return {sync:{channels:[], access:{}}};
  },
  render : function() {
    var sync = this.props.sync;
    console.log("sync", sync)
    var db = this.props.db;
    if (!sync) return <div></div>;
    var channels = sync.channels;
    return <div className="DocSyncPreview">
      <div className="channels">
        <h4>Channels</h4>
        <ul>
        {channels.map(function(ch) {
          return <li>{channelLink(db, ch)}</li>
        })}
        </ul>
      </div>
      <AccessList access={sync.access} db={db}/>
    </div>;
    }
})

window.AccessList = React.createClass({
  render : function() {
    var db = this.props.db;
    var accessList = []
    for (var ch in this.props.access) {
      accessList.push({name: ch, users: this.props.access[ch]})
    }
    return <div className="access">
    <h4>Access</h4>
    <dl>
    {accessList.map(function(ch) {
      return <span><dt>{channelLink(db, ch.name)}</dt>
        {ch.users.map(function(who){
            return <dd>{userLink(db, who)}</dd>
          })}</span>
    })}
    </dl>
  </div>
  }
})

var clear = <br className="clear"/>

window.DocInfo = React.createClass({
  mixins : [StateForPropsMixin],
  getInitialState: function() {
    return {doc: {}, sync : {channels:{}, access:{}}, db : this.props.db};
  },
  setStateForProps : function(props) {
    console.log("setStateForProps", props)
    if (props.db && props.docID) {
      sg.get([props.db, "_raw", props.docID], function(err, data) {
        var sync = data._sync;
        delete data._sync;
        var state = {doc : data, sync: sync, docID : props.docID, db : props.db};
        // if (this.props.syncFunctionCode) {
        //   state.preview = runSyncFunction(this.props.syncFunctionCode, data)
        // }
        this.setState(state);
      }.bind(this))
    } else {
      this.setState(this.getInitialState())

    }
  },
  render : function() {
    console.log("DocInfo", this.state)
    return (
      /*jshint ignore:start */
      <div className="DocInfo">
        <JSONDoc doc={this.state.doc} id={this.state.docID}/>
        <DocSyncPreview db={this.state.db} sync={this.state.sync} id={this.state.docID}/>
        {clear}
      </div>
      /*jshint ignore:end */
    );
  }
});

