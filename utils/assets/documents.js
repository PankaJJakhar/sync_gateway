/** @jsx React.DOM */


var sg = require("coax")(location.origin);

window.DocumentsPage = React.createClass({
  render : function() {
    var db = this.props.db;
    var docID = this.props.docID;
    return (
      /*jshint ignore:start */
      <div>
      <Nav db={db} page="users"/>
      <h2>Users for Database: {db}</h2>
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


var DocInfo = React.createClass({
  getInitialState: function() {
    return {doc: {} ,docID : "", db : false};
  },
  setStateForProps : function(props) {
    console.log("setStateForProps", props)
    if (props.db && props.docID) {
      sg.get([props.db, props.docID], function(err, data) {
        this.setState({doc : data, docID : props.docID, db : props.db})
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
      <div>
      <h2>ID: {docID}</h2>
      <h3>JSON Document</h3>
      <pre><code>{JSON.stringify(doc, null, 2)}</code></pre>
      <a href={dbLink(db, "document/"+docID+"/edit")}>edit</a>
      </div>
      /*jshint ignore:end */
    );
  }
});

