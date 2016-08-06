"use strict";

let childProcess = require("child_process"),
	helper = require("./helper.js");

module.exports.local = function(command, options) {
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
	helper.log(command, "green", server);

	let response = childProcess.execSync(command);
	response = new Buffer(response).toString();

	if (escape === undefined || escape === true) {
		response = response.replace("\n", "");
	}

	helper.log(response, "mint", server);

	return response;
};