/**
 * @jsx React.DOM
 */

window.AllDatabases = React.createClass({
  loadList : function() {
    var w = this;
    sg.get("_all_dbs", function(err, list) {
      w.setState({dbs: list});
    });
  },
  getInitialState: function() {
    return {dbs: []};
  },
  componentWillMount: function() {
    console.log("alldbs")
    this.loadList();
  },
  render : function() {
    console.log(this.state)
    var dbs = this.state.dbs;
    return (
      <ul>
      {dbs.map(function(name) {
        return <li key={name}><a href={"/_utils/db/"+name+"/channels"}>{name}</a></li>;
      })}
      </ul>
    );
  }
});
