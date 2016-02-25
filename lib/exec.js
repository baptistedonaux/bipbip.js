"use strict";

var helper = require("./helper.js"),
	child_process = require("child_process"),
	fs = require("fs"),
	cluster = require("cluster"),

	conn = null;

module.exports.local = function local(command, options) {
	if (options === undefined) {
		options = {};
	}

	helper.log(command, "green");

	var response = child_process.execSync(command, options);
	response = new Buffer(response).toString();

	helper.log(response, "mint");

	return response;
};

module.exports.remote = function(server, command, escape) {
	command =  ["ssh", "-o StrictHostKeyChecking=no", [server.user, server.host].join("@")].join(" ") + " '" + command + "'";
	helper.log(command, "green");

	var response = child_process.execSync(command);
	response = new Buffer(response).toString();

	if (escape === undefined || escape === true) {
		response = response.replace("\n", "");
	}

	helper.log(response, "mint");

	return response;
};