/**
 * @jsx React.DOM
 */

window.AllDatabases = React.createClass({
  loadList : function() {
    sg.get("_all_dbs", function(err, list) {
      this.setState({dbs: list});
    }.bind(this));
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
    return (<div>
      <h3>Databases</h3>
      <ul>
      {dbs.map(function(name) {
        return <li key={name}><a href={dbLink(name)}>{name}</a></li>;
      })}
      </ul>
    </div>);
  }
});
