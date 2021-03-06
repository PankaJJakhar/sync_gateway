//  Copyright (c) 2012 Couchbase, Inc.
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
//  except in compliance with the License. You may obtain a copy of the License at
//    http://www.apache.org/licenses/LICENSE-2.0
//  Unless required by applicable law or agreed to in writing, software distributed under the
//  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
//  either express or implied. See the License for the specific language governing permissions
//  and limitations under the License.

package db

import (
	"crypto/md5"
	"encoding/json"
	"fmt"

	"github.com/couchbaselabs/sync_gateway/base"
)

// The body of a CouchDB document/revision as decoded from JSON.
type Body map[string]interface{}

func (body Body) ShallowCopy() Body {
	copied := make(Body, len(body))
	for key, value := range body {
		copied[key] = value
	}
	return copied
}

// Looks up the raw JSON data of a revision that's been archived to a separate doc.
// If the revision isn't found (e.g. has been deleted by compaction) returns 404 error.
func (db *Database) getOldRevisionJSON(docid string, revid string) ([]byte, error) {
	data, err := db.Bucket.GetRaw(oldRevisionKey(docid, revid))
	if base.IsDocNotFoundError(err) {
		base.LogTo("CRUD+", "No old revision %q / %q", docid, revid)
		err = base.HTTPErrorf(404, "missing")
	}
	if data != nil {
		base.LogTo("CRUD+", "Got old revision %q / %q --> %d bytes", docid, revid, len(data))
	}
	return data, err
}

func (db *Database) setOldRevisionJSON(docid string, revid string, body []byte) error {
	base.LogTo("CRUD+", "Saving old revision %q / %q (%d bytes)", docid, revid, len(body))
	return db.Bucket.SetRaw(oldRevisionKey(docid, revid), 0, body)
}

//////// UTILITY FUNCTIONS:

func oldRevisionKey(docid string, revid string) string {
	return fmt.Sprintf("_sync:rev:%s:%d:%s", docid, len(revid), revid)
}

// Version of FixJSONNumbers (see base/util.go) that operates on a Body
func (body Body) FixJSONNumbers() {
	for k, v := range body {
		body[k] = base.FixJSONNumbers(v)
	}
}

func createRevID(generation int, parentRevID string, body Body) string {
	// This should produce the same results as TouchDB.
	digester := md5.New()
	digester.Write([]byte{byte(len(parentRevID))})
	digester.Write([]byte(parentRevID))
	digester.Write(canonicalEncoding(stripSpecialProperties(body)))
	return fmt.Sprintf("%d-%x", generation, digester.Sum(nil))
}

func parseRevID(revid string) (int, string) {
	if revid == "" {
		return 0, ""
	}
	var generation int
	var id string
	n, _ := fmt.Sscanf(revid, "%d-%s", &generation, &id)
	if n < 1 || generation < 1 {
		base.Warn("parseRevID failed on %q", revid)
		return -1, ""
	}
	return generation, id
}

func compareRevIDs(id1, id2 string) int {
	gen1, sha1 := parseRevID(id1)
	gen2, sha2 := parseRevID(id2)
	switch {
	case gen1 > gen2:
		return 1
	case gen1 < gen2:
		return -1
	case sha1 > sha2:
		return 1
	case sha1 < sha2:
		return -1
	}
	return 0
}

func stripSpecialProperties(body Body) Body {
	stripped := Body{}
	for key, value := range body {
		if key == "" || key[0] != '_' || key == "_attachments" || key == "_deleted" {
			stripped[key] = value
		}
	}
	return stripped
}

func canonicalEncoding(body Body) []byte {
	encoded, err := json.Marshal(body) //FIX: Use canonical JSON encoder
	if err != nil {
		panic(fmt.Sprintf("Couldn't encode body %v", body))
	}
	return encoded
}
