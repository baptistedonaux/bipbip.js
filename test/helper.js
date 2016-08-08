"use strict";

var expect = require("expect.js");
var helper = require("../lib/helper.js");

describe('Helper', function() {
	describe('ln()', function () {
		it('returns the right command', function () {
			expect(helper.ln("/from", "/to")).to.equal("[ -L /to ] || ln -s /from /to");
		});
	});

	describe('touch()', function () {
		it('returns the right command', function () {
			expect(helper.touch("/touch_my_file")).to.equal("[ -e /touch_my_file ] || touch /touch_my_file");
		});
	});

	describe('mkdir()', function () {
		it('returns the right command', function () {
			expect(helper.mkdir("/create_folder", "/create_folder_2")).to.equal("mkdir -p /create_folder /create_folder_2");
		});
	});

	describe('merge()', function () {
		it('returns an object', function () {
			expect(helper.merge()).to.be.an("object");
			expect(helper.merge({})).to.be.an("object");
			expect(helper.merge({}, null)).to.be.an("object");
			expect(helper.merge(null, {})).to.be.an("object");
			expect(helper.merge(null, {}, null)).to.be.an("object");
		});

		it('returns an not null object', function () {
			expect(helper.merge()).to.not.be(null);
			expect(helper.merge({}, null)).to.not.be(null);
			expect(helper.merge(null, {})).to.not.be(null);
			expect(helper.merge(null, {}, null)).to.not.be(null);
		});

		it('returns an object {}', function () {
			expect(helper.merge()).to.eql({});
			expect(helper.merge({})).to.eql({});
			expect(helper.merge(null)).to.eql({});
			expect(helper.merge(null, {})).to.eql({});
			expect(helper.merge({}, null)).to.eql({});
			expect(helper.merge(null, {}, null)).to.eql({});
		});

		it('returns an object merged', function () {
			expect(helper.merge(null, {"a": 1})).to.eql({"a": 1});
			expect(helper.merge({"a": 1}, null)).to.eql({"a": 1});
			expect(helper.merge({"a": 1}, null, {"a": 2})).to.eql({"a": 2});
			expect(helper.merge({"a": 1}, null, {"b": 2})).to.eql({"a": 1, "b": 2});
			expect(helper.merge({"a": 1}, {"b": 2}, {"c": 3})).to.eql({"a": 1, "b": 2, "c": 3});
		});

		it('returns an cascade object merged', function () {
			expect(helper.merge({"a": 1}, {"b": [1]})).to.eql({"a": 1, "b": [1]});
			expect(helper.merge({"a": 1}, {"b": [1]}, {"b": [2]})).to.eql({"a": 1, "b": [2]});
			expect(helper.merge({"a": 1}, {"b": {"c": 1}}, {"b": {"d": 2}})).to.eql({"a": 1, "b": {"c": 1, "d": 2}});
			expect(helper.merge({"a": 1, "b": {"c": 1, "d": 2}}, {"b": 2})).to.eql({"a": 1, "b": 2});
			expect(helper.merge({"a": 1, "b": {"c": 1, "d": 2}}, {"b": null})).to.eql({"a": 1, "b": null});
		});
	});
});