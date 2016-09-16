"use strict";

const childProcess = require("child_process");

module.exports.local = function(write, command, options) {
	return new Promise((resolve, reject) => {
		if (options === undefined) {
			options = {};
		}

		write(command, "green");

		childProcess.exec(command, options, (error, stdout, stderr) => {
			if (error) {
				return reject(error, stderr);
			}

			let response = stdout.toString();

			write(response, "mint");

			resolve(response);
		});
	});
};

module.exports.remote = function(write, server, command, escape) {
	return new Promise((resolve, reject) => {
		command =  `ssh -o StrictHostKeyChecking=no ${server.user}@${server.host} '${command}'`;
		write(command, "green", server);

		childProcess.exec(command, function(error, stdout, stderr) {
			if (error) {
				return reject(stderr);
			}

			let response = stdout.toString();

			if (escape === undefined || escape === true) {
				response = response.replace("\n", "");
			}

			write(response, "mint", server);

			resolve(response);
		});
	});
};
