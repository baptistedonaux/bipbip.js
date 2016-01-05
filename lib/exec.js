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

	if (Array.isArray(command) === true) {
		for (var i = 0; i < command.length; i++) {
			cluster.setupMaster({
				exec: __dirname + "/index.js",
				args: [
					JSON.stringify({
						command: command[i],
						options: options
					}),
				]
			});
			cluster.fork();
		};

		console.log("En attente des workers… (" + Object.getOwnPropertyNames(cluster.workers).length + " actifs)");

		var cmds = [];
		var tpl = "[ -d /proc/__pid__ ] && [ -z `grep zombie /proc/__pid__/status` ]";

		for (var worker in cluster.workers) {
			cmds.push(tpl.replace(/__pid__/g, cluster.workers[worker].process.pid));
		}

		local("while " + cmds.join(" && ") + "; do sleep 1 ; done");

		console.log("Workers finished jobs");
	} else {
		helper.log(command, "green");

		var response = child_process.execSync(command, options);
		response = new Buffer(response).toString();

		helper.log(response, "mint");

		return response;
	};
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