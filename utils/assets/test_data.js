var hostname = "http://localhost:4985/", db_name = "sync_gateway",
  assert = require("assert"),
  syncState = require("./data"),
  sga = require("coax")(hostname)

console.log("test our module loaded")
assert.ok(syncState.SyncStateForDatabase, "SyncStateForDatabase API exists")


console.log("test if database is accessible")
var db = sga(db_name)

function getNext(argumentz) {
  var boundNext, args = Array.prototype.slice.call(argumentz),
    next = args[0];
  if (next) {
    boundNext = next.bind.apply(next, args)
  } else {
    boundNext = function(){}
  }
  return boundNext;
}

function setUp() {
  var next = getNext(arguments);
  db.get("_info", function(err, info) {
    // console.log("db info", err, info)
    assert.ok(!err, "error getting database info")
    assert.ok(info.db_name, "info.db_name exists")
    // assert.equal(info.doc_count, 0, "database should be empty")

    console.log("test creating documents on channels")
    db.post("_bulk_docs", {
      docs : [{
        _id : "ace",
        channels : ["xylophone", "yakima", "zoo"]
      }, {
        _id : "booth",
        channels : ["yakima", "zoo"]
      }, {
        _id : "cat",
        channels : ["claws"]
      }]
    }, function(err, ok){
      // console.log("posted docs", err, ok)
      assert.ok(!err, "posted docs")
      assert.equal(ok.length, 3, "all saved")
      next()
    })
  })
}

var dbState;
function initData() {
  var next = getNext(arguments);
  console.log("initData",hostname+db_name)
  dbState = syncState.SyncStateForDatabase(hostname+db_name)
  console.log("dbState", dbState)
  var changeHandler = function(change) {
    console.log("change", change.id)
    assert.notEqual(change.id, "cat", "we called removeListener")
    if (change.id == "booth") {
      console.log("booth")
      var chan = dbState.channel("yakima")
      console.log("chan yakima", chan);
      dbState.removeListener("change",changeHandler)
      next()
    }
  }
  dbState.on("change", changeHandler)
}

function runPreview() {
  var next = getNext(arguments);
  console.log("runPreview")
  var chan = dbState.channel("yakima")
  assert.ok(chan.changes, "has changes")
  assert.equal(chan.changes[0].id, "booth")
  assert.equal(chan.changes[1].id, "ace")
  next()
}

setUp(initData, runPreview)


