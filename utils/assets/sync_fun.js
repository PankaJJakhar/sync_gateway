/** @jsx React.DOM */

window.SyncEditPage = React.createClass({
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
    // <p>{db} has {info.doc_count} docs. {info.update_seq} updates.</p>
    return (
      <div>
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
    this.setState({docID : dbState(this.props.db).randomAccessDocID()})
  },
  handleRandomDoc : function() {
    this.setState({docID : dbState(this.props.db).randomDocID()})
  },
  componentDidMount : function(){
    this.handleRandomAccessDoc()
  },
  render : function() {
    console.log("SyncFunctionView", this.state, this.props)
    return <div className="SyncFunctionView">
      <p>The <strong>Sync Function</strong> determines application-specific behavior regarding who can see and modify which documents. The code you write here can validate updates, route documents to channels, and grant access privileges  to users and groups on a per-channel basis. For more information <a href="http://docs.couchbase.com/sync-gateway/#sync-function-api">see the Sync Function API documentation.</a></p>
      <p>Try some examples:
      <ul className="defaults">
      <li><a onClick={this.handleExampleClick.bind(this, "basic")}>basic</a> - {"the default Sync Function used when the application doesn't specify one"}</li>
      <li>personal data - just sync my data to my devices, no sharing</li>
      <li>social rooms - todos, chat, photo sharing, can all use a room membership model.</li>
      </ul>
      </p>

      <div className="SyncFunctionPreview">
        <form className="SyncFunctionCode">
          <h3>Sync Function</h3>
          <textarea ref="syncCode" value={this.state.code || this.props.code}/>
          <button>Live Preview Mode</button> <button>Deploy To Server</button>
        </form>
        <div className="SyncPreview">
          Preview sync function output by running your code on real documents. <strong>Select a <a onClick={this.handleRandomDoc}>random document</a> or one that <a onClick={this.handleRandomAccessDoc}>grants access to channels</a>.</strong>
          <DocInfo db={this.props.db} docID={this.state.docID}/>
          <p>You can compare your channel mapping and access grants with the output of the currently deployed sync function.</p>
        </div>
      </div>
    </div>
  }
})
