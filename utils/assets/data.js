var events = require('events'),
  coax = require("coax");

var dbStateSingletons = {};
exports.SyncStateForDatabase = function(db) {
  var state = dbStateSingletons[db]
  if (!state) {
    state = new SyncState(db)
    dbStateSingletons[db] = state
  }
  return state
}

function SyncState(db) {
  // setup on / emit / etc
  events.EventEmitter.call(this);

  // private state
  var previewFun, self=this, client = coax(db),
    dbInfo = {}, previewChannels = {};
    /*
      "name" : {
        docs : {"docid" : seq},
        access : {
          "docid" : [userid, userid, roleid, ...]
        }
      }
    */

  // public state
  this.db = db;
  this.client = client;
  this.pageSize = 100

  // pubic methods
  this.setSyncFunction = function(funCode) {
    oldCode = previewFun && previewFun.code
    if (funCode == oldCode) {
      return;
    }
    previewChannels = {};
    previewFun = compileSyncFunction(funCode)
    previewFun.code = funCode
    loadChangesHistory()
    if (this.deployedSyncFunction() == funCode) {
      this.emit("deployed")
    } else {
      this.emit("preview")
    }
  }
  this.getSyncFunction = function() {
    return previewFun.code;
  }
  this.channelNames = function() {
    return Object.keys(previewChannels);
  }
  this.deployedSyncFunction = function(){
    return dbInfo.config.sync || "function(doc){\n  channel(doc.channels)\n}";
  }
  this.deploySyncFunction = function(code, done) {
    var newConfig = {}
    for (var k in dbInfo.config) {
      if (dbInfo.config[k]) {
        newConfig[k] = dbInfo.config[k]
      }
    }
    newConfig.sync = code;
    client.del([""]/*[""] to force trailing slash*/,function(err, ok){
      // if (err) return done(err);
      client.put([""]/*[""] to force trailing slash*/,newConfig, function(err, ok){
        if (!err) {
          self.setSyncFunction(code)
        }
        done(err, ok)
      })
    })
  }
  this.channel = function(name) {
    var changes = [], revs ={}, chan = previewChannels[name];
    if (!chan) return {name:name, changes:[]};
    var docs = chan.docs;

    for (var id in docs) revs[docs[id]] = id
    var rs = Object.keys(revs).sort(function(a, b){
      return parseInt(a) - parseInt(b);
    })
    for (var i = rs.length - 1; i >= 0; i--) {
      var docid = revs[rs[i]]
      changes.push({id:docid, seq:parseInt(rs[i])})
    }
    var result = {
      name : name,
      changes : changes
    }
    if (Object.keys(chan.access).length) {result.access = chan.access}
    return result
  }
  this.randomAccessDocID = function() {
    var chs = this.channelNames()
    chs = shuffleArray(chs);
    var ch;
    while (ch = chs.pop()) {
      var chInfo = this.channel(ch);
      if (chInfo.access) {
        var ids = Object.keys(chInfo.access)
        return ids[Math.floor(Math.random()*ids.length)]
      }
    }
  }
  this.randomDocID = function(){
    var chs = this.channelNames()
    var ch = chs[Math.floor(Math.random()*chs.length)]
    var chInfo = this.channel(ch);
    var rIds = chInfo.changes.map(function(c){return c.id})
    return rIds[Math.floor(Math.random()*rIds.length)]
  }
  this.getDoc = function(id, cb){
    client.get(["_raw", id], function(err, raw) {
      if (err) {return cb(err);}
      var deployed = raw._sync;
      delete raw._sync;
      var previewSet = {}
      var preview = runSyncFunction(previewSet, id, raw, 0)

      console.log("deployed.access", deployed.access)

      cb(raw, transformDeployed(id, deployed), transformPreview(id, preview))
    });
  }

  // private implementation
  function transformDeployed(id, deployed){
    var access = {};
    for (var user in deployed.access) {
      var chans = Object.keys(deployed.access[user])
      chans.forEach(function(ch){
        access[ch] = access[ch] || []
        access[ch].push(user)
        access[ch] = access[ch].sort()
      })
    }
    return {
      access : access,
      channels : Object.keys(deployed.channels)
    }
  }

  function transformPreview(id, preview) {
    // console.log("preview", preview)
    var channelSet = {}
    preview.access.forEach(function(acc) {
      acc.channels.forEach(function(ch) {
        channelSet[ch] = channelSet[ch] || [];
        channelSet[ch] =
          mergeUsers(channelSet[ch], acc.users);
      })
    })
    console.log("preview.access", channelSet)
    return {
      access : channelSet,
      channels : preview.channels,
      reject : preview.reject
    };
  };

  function getDocAccessMap(done) {
    var docAccessMap = {};
    client.get(["_view", "access"], function(err, data) {
      console.log("access", data)
      data.rows.forEach(function(r) {
        for (var ch in r.value) {
          docAccessMap[ch] = docAccessMap[ch] || {}
          docAccessMap[ch][r.id] = r.value[ch];
        }
      })
      done(err, docAccessMap)
    })
  }

  function runSyncFunction(channelSet, id, doc, seq) {
    // console.log('previewFun', doc)
    doc._id = id
    var sync = previewFun(doc, false, null)
    // console.log('previewFun', doc._id, doc, sync)
    if (sync.reject) {
      console.error("update rejected by sync function", doc, sync)
      return;
    }
    var changed = {};
    sync.channels.forEach(function(ch) {
      channelSet[ch] = channelSet[ch] || {docs : {}, access:{}};
      channelSet[ch].docs[id] = seq;
      changed[ch]=true;
    })
    sync.access.forEach(function(acc) {
      acc.channels.forEach(function(ch){
        changed[ch]=true;
        channelSet[ch] = channelSet[ch] || {docs : {}, access:{}};
        channelSet[ch].access[id] =
          mergeUsers(channelSet[ch].access[id], acc.users);
      })
    })
    Object.keys(changed).forEach(function(channel) {
      self.emit("ch:"+channel);
    })
    return sync;
  }

  function mergeUsers(existing, more) {
    var keys = {};
    existing = existing || [];
    for (var i = existing.length - 1; i >= 0; i--) {
      keys[existing[i]] = true;
    };
    for (i = more.length - 1; i >= 0; i--) {
      keys[more[i]] = true;
    };
    return Object.keys(keys).sort()
  }

  function loadChangesHistory(){
    // get first page
    client.get(["_changes", {limit : self.pageSize, include_docs : true}], function(err, data) {
      // console.log("history", data)
      data.results.forEach(onChange)
      self.emit("batch")

      client.changes({since : data.last_seq, include_docs : true}, function(err, data){
        // console.log("changes", data);
        onChange(data)
      })
    })
  }

  self.once("batch", function() {
    self.connected = true;
    self.emit("connected")
  })
  self.on("newListener", function(name, fun){
    if (name == "connected" && self.connected) {
      fun()
    }
  })

  function onChange(ch) {
    var seq = parseInt(ch.seq.split(":")[1])
    // console.log("onChange", seq, ch)
    if (!ch.doc) {
      console.log("no doc", ch)
      return;
    }
    runSyncFunction(previewChannels, ch.id, ch.doc, seq)
    self.emit("change", ch)
  }

  client.get("_info", function(err, info) {
    if (err) throw(err);
    dbInfo = info;
    self.setSyncFunction(info.config.sync || "function(doc){\n  channel(doc.channels)\n}");
  })
}

SyncState.prototype.__proto__ = events.EventEmitter.prototype;







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

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

var syncWrapper = function(newDoc, oldDoc, realUserCtx) {
  syncCodeStringHere

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
    access : [],
    reject : false
  };
  function channel(){
    var args = Array.prototype.slice.apply(arguments);
    results.channels = Array.prototype.concat.apply(results.channels, args);
  }
  function access(users, channels){
    results.access.push({
      users : makeArray(users),
      channels : makeArray(channels)
    })
  }
  function reject(code, message) {
    results.reject = [code, message];
  }
  try {
    // console.log("syncFun", newDoc)
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
}.toString();

function compileSyncFunction(syncCode) {
  var codeString = "var syncFun = ("+ syncCode+")",
    wrappedCode = syncWrapper.replace("syncCodeStringHere", codeString),
    evalString = "var compiledFunction = ("+ wrappedCode+")";
  eval(evalString);
  return compiledFunction;
}
