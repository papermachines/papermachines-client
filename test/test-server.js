"use strict";

var server = require("./server");
var before = require("sdk/test/utils").before;

var fakeItem = {
    "itemType": "webpage",
    "file-url": "",
    "library-key": "-1",
    "last-modified": new Date(1999, 0, 1)
};

var fakeItemOnlyOnce = {
    "itemType": "webpage",
    "file-url": "",
    "library-key": "-2",
    "last-modified": new Date(1999, 0, 1)
};

var fakeItemUpdated = {
    "itemType": "webpage",
    "file-url": "",
    "library-key": "-1",
    "last-modified": new Date()
};

function onError(assert, done) {
    return function(error) {
        assert.fail(error);
        done();
    };
}

exports["test create new corpus"] = function(assert, done) {
    var corpusID = server.findOrCreateCorpus("Testing", "-1");
    corpusID.then(function(id) {
        assert.ok(id, "Corpus created");
    }, onError(assert, done)).then(done, onError(assert, done));
};

exports["test create corpus exactly once"] = function(assert, done) {
    var name = "Testing2",
        externalID = "-2";

    server.findOrCreateCorpus(name, externalID).then(function(id1) {
        return server.findOrCreateCorpus(name, externalID).then(function(id2) {
            assert.equal(id1, id2, "Corpus is only created once");
        }, onError(assert, done)).then(done, onError(assert, done));
    }, onError(assert, done));
};

exports["test add item to corpus"] = function(assert, done) {
    var corpusID = server.findOrCreateCorpus("Testing", "-1");
    var send = server.sendItemToServer(corpusID, fakeItem);
    send.then(function(result) {
        assert.ok(result, "Item created");
        assert.equal(result.statusText, "Created", "Item was created");
        assert.equal(result.message, "new", "Item is new");
    }, onError(assert, done)).then(done, onError(assert, done));
};

exports["test add item only once"] = function(assert, done) {
    var corpusID = server.findOrCreateCorpus("Testing", "-1");
    var send = server.sendItemToServer(corpusID, fakeItemOnlyOnce);
    send.then(function(result) {
        assert.ok(result, "Item created");
        assert.equal(result.statusText, "Created", "Item was created");
    }, onError(assert, done)).then(function() {
        return server.sendItemToServer(corpusID, fakeItemOnlyOnce);
    }, onError(assert, done)).then(function(result) {
        assert.equal(result.statusText, "OK", "Item was found");
        assert.equal(result.message, "found", "Item already existed");
    }, onError(assert, done)).then(done, onError(assert, done));
};

exports["test update item if newer"] = function(assert, done) {
    var corpusID = server.findOrCreateCorpus("Testing", "-1");
    var send = server.sendItemToServer(corpusID, fakeItem);
    send.then(function(result) {
        assert.ok(result, "Item sent");
    }, onError(assert, done)).then(function() {
        return server.sendItemToServer(corpusID, fakeItemUpdated);
    }, onError(assert, done)).then(function(result) {
        assert.equal(result.statusText, "OK", "Item existed");
        assert.equal(result.message, "updated", "Item was altered");
    }, onError(assert, done)).then(done, onError(assert, done));
};

before(exports, function() {
    server.getExistingCorpora(); // ensures server is running
});

require("sdk/test").run(exports);