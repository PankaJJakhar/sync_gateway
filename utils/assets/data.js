var events = require('events'),
  coax = require("coax");

// if (typeof window == "undefined" && module && module.exports) {
//   window = module.exports
// }

var dbStateSingletons = {};
exports.SyncStateForDatabase = function(db, syncFun) {
  var state = dbStateSingletons[db]
  if (!state) {
    state = new SyncState(db, syncFun)
    dbStateSingletons[db] = state
  }
  return state
}

function SyncState(db, syncFun) {
  this.db = db;
  this.client = coax(db);
  // initially populated by view queries
  events.EventEmitter.call(this);

  this.deployedChannels = {
    /*
    "name" : {
      changes : [{id: docid, seq:num}],
      access : {
        "docid" : [userid, userid, roleid, ...]
      }
    }
    */
  };
  // only populated by changes processed by the syncFun locally
  this.previewChannels = {};
  this.deployedDocs = {};
  this.deployedUsers = {};

  this.pageSize = 100;

  this.setSyncFunction(syncFun || "function(doc){\n  channel(doc.channels)\n}");

  // this.loadDeployedData();
  this._loadChangeHistory();
}

SyncState.prototype.__proto__ = events.EventEmitter.prototype;


function compileSyncFunction(syncCode) {
  return function(newDoc, oldDoc, realUserCtx) {
    // var syncFun;
    // todo: cache the value of eval on a per userCtx basis
    // (especially optimize this in sync gateway)
    var evalString = "var syncFun = ("+ syncCode+")"
    // console.log("evalString", evalString)

    eval(evalString)

    function makeArray(maybeArray) {
      if (Array.isArray(maybeArray)) {
        return maybeArray;
      } else {
        return [maybeArray];
      }
    }

    function inArray(string, array) {
      return array.indexOf(string) != -1;
    }

    function anyInArray(any, array) {
      for (var i = 0; i < any.length; ++i) {
        if (inArray(any[i], array))
          return true;
      }
      return false;
    }

    // Proxy userCtx that allows queries but not direct access to user/roles:
    var shouldValidate = (realUserCtx !== null && realUserCtx.name !== null);

    function requireUser(names) {
        if (!shouldValidate) return;
        names = makeArray(names);
        if (!inArray(realUserCtx.name, names))
          throw({forbidden: "wrong user"});
    }

    function requireRole(roles) {
        if (!shouldValidate) return;
        roles = makeArray(roles);
        if (!anyInArray(realUserCtx.roles, roles))
          throw({forbidden: "missing role"});
    }

    function requireAccess(channels) {
        if (!shouldValidate) return;
        channels = makeArray(channels);
        if (!anyInArray(realUserCtx.channels, channels))
          throw({forbidden: "missing channel access"});
    }
    var results = {
      channels : [],
      access : []
    };
    function channel(){
      var args = Array.prototype.slice.apply(arguments);
      results.channels = Array.prototype.concat.apply(results.channels, args);
    }

    try {
      syncFun(newDoc, oldDoc);
    } catch(x) {
      if (x.forbidden)
        reject(403, x.forbidden);
      else if (x.unauthorized)
        reject(401, x.unauthorized);
      else
        throw(x);
    }
    return results;
  }
}

SyncState.prototype.channel = function(name) {
  var changes = [], revs ={}, docs = this.previewChannels[name];
  for (var id in docs) revs[docs[id]] = id
  var rs = Object.keys(revs).sort(function(a, b){
    return parseInt(a) - parseInt(b);
  })
  for (var i = rs.length - 1; i >= 0; i--) {
    var docid = revs[rs[i]]
    changes.push({id:docid, seq:parseInt(rs[i])})
  }
  return {
    name : name,
    changes : changes
  }
}
SyncState.prototype.setSyncFunction = function(syncFun) {
  this.syncFun = compileSyncFunction(syncFun)
};

SyncState.prototype._runSyncFunction = function(doc) {
  return this.syncFun(doc, false, {})
}

SyncState.prototype._onChange = function(ch) {
  // console.log("change", ch)
  var preview = this._runSyncFunction(ch.doc)
  var seq = parseInt(ch.seq.split(":")[1])
  // console.log("results", results)
  this._integratePreview(seq, ch.id, preview);
  this.emit("change", ch)
}

SyncState.prototype._integratePreview = function(seq, docid, sync) {
  sync.channels.forEach(function(ch) {
    this.previewChannels[ch] = this.previewChannels[ch] || {}
    this.previewChannels[ch][docid] = seq;
  }.bind(this))
}


SyncState.prototype._loadChangeHistory = function() {
  // get first page
  this.client.get(["_changes", {limit : 20, include_docs : true}], function(err, data) {
    data.results.forEach(this._onChange.bind(this))
  }.bind(this))
};

// function runSyncFunction(code, doc, oldDoc, userCtx) {
//   return doc;
// }

// var docAccessMap = {};
// function getDocAccessMap(db, done) {
//   sg.get([db, "_view", "access"], function(err, data) {
//     data.rows.forEach(function(r) {
//       for (var ch in r.value) {
//         docAccessMap[ch] = docAccessMap[ch] || {}
//         docAccessMap[ch][r.id] = r.value[ch];
//       }
//     })
//     done(err, docAccessMap)
//   })
// }


// window.channelWatcher = function(db) {
//   var state = {
//     channels : {}
//   }
//   var watchers = {};
//   function didChange(change) {
//     for (var w in watchers) {
//       if (watchers.hasOwnProperty(w)) {
//         watchers[w](change)
//       }
//     }
//   }

//   // subscribeToDbChanges(db, function(change){})
//   queryAllChannels(db, function(err, chs) {
//     console.log("queryAllChannels done", err, chs)
//     if (err) return;

//     getDocAccessMap(db, function(err, accessMap) {
//       state.access = accessMap;
//       state.channels = chs;
//       didChange()
//     })

//   })

//   function channelsList(forChannels) {
//     return forChannels.map(function(ch){
//       return {name : ch, docs : state.channels[ch], access : state.access[ch]}
//     })
//   }

//   return {
//     setChannels : function(newChannels) {
//       console.log("setChannels", newChannels)
//     },
//     onChange : function(name, handler) {
//       watchers[name] = handler
//     },
//     channelNames : function() {
//       return Object.keys(state.channels)
//     },
//     channels : function(forChannels){
//       var channels = channelsList(forChannels);
//       var chLists = [];

//       channels.forEach(function(ch){
//         var changes = [];

//         var revs ={}, docs = ch.docs;
//         for (var id in docs)
//           revs[docs[id]] = id
//         var rs = Object.keys(revs).sort(function(a, b){
//           return parseInt(a) - parseInt(b);
//         })
//         // for (var i = 0; i <= rs.length; i++) {
//         for (var i = rs.length - 1; i >= 0; i--) {
//           var docid = revs[rs[i]];
//           changes.push([docid, rs[i]])
//         }
//         ch.changes = changes;
//         chLists.push(ch)
//       })
//       return chLists
//     }
//   };
// }

// function queryAllChannels(db, done) {
//   sg.get([db, "_view", "channels"], function(err, data) {
//     if (err) return done(err);
//     console.log("queryAllChannels", data)
//     var ch, max = 0, keys = {}, rows = data.rows;
//     for (var i = 0; i < rows.length; i++) {
//       ch = rows[i].key[0];
//       keys[ch] = keys[ch] || {};
//       keys[ch][rows[i].id] = rows[i].key[1];
//       if (rows[i].key[1] > max) max = rows[i].key[1];
//     }
//     done(err, keys)
//   });
// }


// // function(max) {
// //     // Object.keys(this.state.channels);
// //     if (this.changes) {
// //       console.log("already watching")
// //       return;
// //     }
// //     // console.log(max)
// //     var opts = {};

// //     opts.filter = "sync_gateway/bychannel";
// //     opts.channels = this.props.watch.join(',')
// //     opts.since = "*:"+(max-1)
// //     var w = this;

// // var oldSeq = {};
// // function parseSeq(seq) {
// //   var chs = seq.split(',');
// //   var seqObj = {};
// //   for (var i = chs.length - 1; i >= 0; i--) {
// //     var ps = chs[i].split(":"),
// //       name = ps[0],
// //       num = parseInt(ps[1])
// //     seqObj[name] = num;
// //   };
// //   var output = {};
// //   for (var k in oldSeq) {
// //     if (!seqObj[k]) {
// //       output[k] = seqObj[k];
// //     } else if (seqObj[k] && seqObj[k] !== oldSeq[k]) {
// //       output[k] = seqObj[k];
// //     }
// //   }
// //   oldSeq = seqObj;
// //   return output;
// // }
// // console.log("change opts", opts)
// //     this.changes = coax([location.origin, this.props.db]).changes(opts, function(err, change) {
// //       console.log("change", err, change)
// //       var channels = w.state.channels;
// //       var seq = parseSeq(change.seq)
// //       var changed = false
// //       console.log("before change", seq, change)
// // // detect which channel got a new num in the seq feed...
// //       for (var ch in seq) {
// //         if (!channels[ch]) {
// //           console.log("ignore", change)
// //           continue;
// //           // channels[ch] = {}
// //         }
// //         channels[ch][change.id] = seq[ch]
// //         changed = true
// //         console.log("changed", ch, change.id, seq[ch])
// //       }
// //       // console.log("after change", JSON.stringify(channels))
// //       if (changed) w.setState({channels:channels})
// //     })

// //   }
