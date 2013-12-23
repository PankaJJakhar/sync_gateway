/** @jsx React.DOM */

window.DbInfoPage = React.createClass({
  getInitialState: function() {
    return {info: {config:{}}, db : false};
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
  handleExampleClick : function(){
    console.log("handleExampleClick", this.refs.syncCode.getDOMNode())
    var ta = this.refs.syncCode.getDOMNode()
    ta.value = examples["basic"]
    //  = examples["basic"];
  },
  render : function() {
    var docID = "84DEC4C6-D287-4062-8C9B-5692A2CA8929"
    return <div className="SyncFunctionView">
    <h3>Sync Function</h3>
      <p>This code determines Sync Gateway application behavior. It can validate document updates, route documents to channels, and grant access to users and groups to read from channels. For more information <a href="http://docs.couchbase.com/sync-gateway/#sync-function-api">see the Sync Function documentation.</a></p>
      <textarea ref="syncCode" value={this.props.code}/>
      <p>Examples: <a onClick={this.handleExampleClick}>default</a></p>
      <h3>Preview Sync Results</h3>
      <p>This preview shows the channel mapping and access control output of the sync function based on a document in your database.</p>
      <p><a onClick={function(){}}>Select a random document.</a>{" "}
      <a onClick={function(){}}>Select a random document that has access control output.</a></p>
      <DocInfo db={this.props.db} docID={docID}/>
    </div>
  }
})
