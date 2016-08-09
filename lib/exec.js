"use strict";

const childProcess = require("child_process"),
	helper         = require("./helper.js");

module.exports.local = function(command, options) {
	return new Promise((resolve, reject) => {
		if (options === undefined) {
			options = {};
		}

		helper.log(command, "green");

		childProcess.exec(command, options, (error, stdout, stderr) => {
			if (error) {
				return reject(error, stderr);
			}

			let response = stdout.toString();

			helper.log(response, "mint");

			resolve(response);
		});
	});
};

module.exports.remote = function(server, command, escape) {
	return new Promise((resolve, reject) => {
		command =  `ssh -o StrictHostKeyChecking=no ${server.user}@${server.host} '${command}'`;
		helper.log(command, "green", server);

		childProcess.exec(command, function(error, stdout, stderr) {
			if (error) {
				return reject(stderr);
			}

			let response = stdout.toString();

			if (escape === undefined || escape === true) {
				response = response.replace("\n", "");
			}

			helper.log(response, "mint", server);

			resolve(response);
		});
	});
};
