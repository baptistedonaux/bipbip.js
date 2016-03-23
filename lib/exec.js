"use strict";

let helper = require("./helper.js"),
	childProcess = require("child_process");

module.exports.local = function local(command, options) {
	if (options === undefined) {
		options = {};
	}

	helper.log(command, "green");

	let response = childProcess.execSync(command, options);
	response = new Buffer(response).toString();

	helper.log(response, "mint");

	return response;
};

module.exports.remote = function(server, command, escape) {
	command =  ["ssh", "-o StrictHostKeyChecking=no", [server.user, server.host].join("@")].join(" ") + " '" + command + "'";
	helper.log(command, "green");

	let response = childProcess.execSync(command);
	response = new Buffer(response).toString();

	if (escape === undefined || escape === true) {
		response = response.replace("\n", "");
	}

	helper.log(response, "mint");

	return response;
};