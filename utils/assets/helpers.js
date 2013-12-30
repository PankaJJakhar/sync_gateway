
function dbLink(db, path) {
  var base = "/_utils/db/"+db
  if (path) {
    base += "/"+path
  }
  return base
}

function dbState(db) {
  // console.log("dbState",sg(db).url)
  return syncState.SyncStateForDatabase(sg(db).url.toString())
}

window.StateForPropsMixin = {
  componentWillReceiveProps: function(newProps) {
    console.log("StateForPropsMixin componentWillReceiveProps", newProps, this.props)
    this.setStateForProps(newProps, this.props)
  },
  componentWillMount: function() {
    console.log("StateForPropsMixin componentWillMount", this.props)
    this.setStateForProps(this.props)
  }
};


window.EventListenerMixin = {
  listen : function(emitter, event, handler) {
    // console.log("listen", event)
    var mixinState = this.state._EventListenerMixinState || {};
    var sub = mixinState[event];
    if (sub) {
      if (sub.event == event && sub.emitter === emitter) {
        // we are already listening, noop
        // console.log("EventListenerMixin alreadyListening", sub.event)
        return;
      } else {
        // unsubscribe from the existing one
        // console.log("EventListenerMixin removeListener", sub.event)
        sub.emitter.removeListener(sub.event, sub.handler)
      }
    }
    var newSub = {
      emitter : emitter,
      event : event,
      handler : handler
    }
    emitter.on(event, handler)
    this.setState({_EventListenerMixinState : mixinState});
  },
  componentWillUnmount : function() {
    var mixinState = this.state._EventListenerMixinState || {};
    for (var event in mixinState) {
      var sub = mixinState[event];
      console.log("EventListenerMixin removeListener", sub.event)
      sub.emitter.removeListener(sub.event, sub.handler)
    }
  },
}
