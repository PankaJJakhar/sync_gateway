/** @jsx React.DOM */

window.SyncPage = React.createClass({
  render : function() {
    /*jshint ignore:start */
    return (
      <div className="SyncPage">
        <p>The <strong>Sync Function</strong> determines application-specific behavior regarding who can see and modify which documents. The code you write here can validate updates, route documents to channels, and grant access privileges  to users and groups on a per-channel basis. For more information <a href="http://docs.couchbase.com/sync-gateway/#sync-function-api">see the Sync Function API documentation.</a></p>
        <p>Try some examples:
        <ul className="defaults">
        <li><a onClick={""/*this.handleExampleClick.bind(this, "basic")*/}>basic</a> - {"the default Sync Function used when the application doesn't specify one"}</li>
        <li>personal data - just sync my data to my devices, no sharing</li>
        <li>social rooms - todos, chat, photo sharing, can all use a room membership model.</li>
        </ul>
        </p>
        <SyncFunEditor db={this.props.db}/>
      </div>
      )
    /*jshint ignore:end */
  }
})

var examples = {
  "basic" : "function(doc){\n  channel(doc.channels)\n}"
}


var SyncFunEditor = React.createClass({
  render : function() {
    console.log("SyncFunEditor", this.state, this.props)
    return <div className="SyncFunEditor">
      <SyncFunctionForm db={this.props.db}/>
      <SyncPreview db={this.props.db}/>
    </div>
  }
})


var SyncFunctionForm = React.createClass({
  getInitialState : function() {
    return {}
  },
  componentDidMount : function(){
    dbState(this.props.db).on("connected", function(){
      var sync = dbState(this.props.db).deployedSyncFunction()
      this.setState({code : sync})
    }.bind(this))
  },
  render : function() {
    return <form className="SyncFunctionCode">
      <h3>Sync Function</h3>
      <textarea ref="syncCode" value={this.state.code || this.props.code}/>
      <button>Live Preview Mode</button> <button>Deploy To Server</button>
    </form>
  }
})

var SyncPreview = React.createClass({
  getInitialState : function() {
    return {}
  },
  setDoc : function(id) {
    console.log("setDoc", id)
    if (!id) return;
    dbState(this.props.db).getDoc(id, function(doc, deployedSync, previewSync) {
      this.setState({docID : id, doc : doc, deployed : deployedSync, preview : previewSync})
    }.bind(this))
  },
  handleRandomAccessDoc : function() {
    this.setDoc(dbState(this.props.db).randomAccessDocID())
  },
  handleRandomDoc : function() {
    this.setDoc(dbState(this.props.db).randomDocID())
  },
  componentDidMount : function(){
    dbState(this.props.db).on("connected", function(){
      this.handleRandomAccessDoc()
    }.bind(this))
  },
  render : function() {
    console.log("SyncPreview", this.state, this.props)
    return <div className="SyncPreview">
      <JSONDoc doc={this.state.doc} id={this.state.docID}/>
      <div className="docs">
        <p>Preview sync function on real documents:
        <ul className="defaults">
          <li><a onClick={this.handleRandomDoc}>random</a></li>
          <li><a onClick={this.handleRandomAccessDoc}>grants access</a></li>
        </ul>
        </p>
      </div>
      <br className="clear"/>
      <p>Preview results:</p>
      <DocSyncPreview db={this.props.db} id={this.state.docID} sync={this.state.preview}/>
      <br className="clear"/>
      <p>Deployed results:</p>
      <DocSyncPreview db={this.props.db} id={this.state.docID} sync={this.state.deployed}/>
      </div>
  }
})
