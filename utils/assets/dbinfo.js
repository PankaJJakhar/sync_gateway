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
        <p>{info.doc_count} docs. {info.update_seq} updates.</p>
        <code><pre>{info.config.sync}</pre></code>
      </div>
      )
    /*jshint ignore:end */
  }
})
