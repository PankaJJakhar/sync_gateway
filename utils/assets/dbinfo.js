/** @jsx React.DOM */

window.DbInfoPage = React.createClass({
  getInitialState: function() {
    return {info: {config:{}}, db : this.props.db};
  },
  setStateForProps : function(props) {
    console.log("setStateForProps", props)
    if (props.db) {
      sg.get([props.db, "_info"], function(err, data) {
        this.setState({info : data, db : props.db})
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
    var info = this.state.info;
    var db = this.state.db;
    console.log(info.config.sync)
    /*jshint ignore:start */
    return (
      <div>
        <p>{db} has {info.doc_count} docs. {info.update_seq} updates.</p>
        <SyncFunctionView db={db} code={info.config.sync}/>
      </div>
      )
    /*jshint ignore:end */
  }
})

var examples = {
  "basic" : "function(doc){\n  channel(doc.channels)\n}"
}


var SyncFunctionView = React.createClass({
  getInitialState : function() {
    return {docID : ""}
  },
  handleExampleClick : function(def){
    console.log("handleExampleClick", def, this.refs.syncCode.getDOMNode())
    // var ta = this.refs.syncCode.getDOMNode()
    var state = this.state;
    state.code = examples[def]
    this.setState(state)
    // ta.value = examples[def]
    //  = examples["basic"];
  },
  handleRandomAccessDoc : function() {
    console.log("handleRandomAccessDoc", this.props)
    getDocAccessMap(this.props.db, function(err, map){
      var keys = Object.keys(map)
      var randomChannel = map[keys[Math.floor(Math.random()*keys.length)]];
      var rKeys = Object.keys(randomChannel)
      var randomDoc = rKeys[Math.floor(Math.random()*rKeys.length)]
      var state = this.state;
      state.docID = randomDoc
      this.setState(state)
    }.bind(this))
  },
  handleRandomDoc : function() {
    console.log("handleRandomDoc", this.props)
    var watcher = channelWatcher(this.props.db)
    watcher.onChange("handleRandomDoc", function(change) {
      var chs = watcher.channelNames()
      var ch = chs[Math.floor(Math.random()*chs.length)]
      var chInfo = watcher.channels([ch])[0];
      var rIds = Object.keys(chInfo.docs)
      var randomDoc = rIds[Math.floor(Math.random()*rIds.length)]
      var state = this.state;
      state.docID = randomDoc
      this.setState(state)
    }.bind(this))
  },
  componentDidMount : function(){
    this.handleRandomAccessDoc()
  },
  render : function() {
    console.log("SyncFunctionView", this.state, this.props)
    return <div className="SyncFunctionView">
      <h3>Sync Function</h3>
      <div className="SyncFunctionCode">
        <textarea ref="syncCode" value={this.state.code || this.props.code}/>
      </div>

      <p>This code determines Sync Gateway application behavior. It can validate document updates, route documents to channels, and grant access to users and groups to read from channels. For more information <a href="http://docs.couchbase.com/sync-gateway/#sync-function-api">see the Sync Function documentation.</a></p>
      <p>Examples: <a onClick={this.handleExampleClick.bind(this, "basic")}>basic</a></p>
      <h3>Preview Sync Results</h3>
      <p>This preview shows the channel mapping and access control output of the sync function based on a document in your database.</p>
      <p><a onClick={this.handleRandomDoc}>Select a random document.</a>{" "}
      <a onClick={this.handleRandomAccessDoc}>Select a random document that has access control output.</a></p>
      <DocInfo db={this.props.db} docID={this.state.docID}/>
    </div>
  }
})
