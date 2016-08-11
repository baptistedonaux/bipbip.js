"use strict";

const constant = require("./constant.js"),
    exec     = require("./exec.js"),
    helper   = require("./helper.js");

const Bipbip = function(path, env) {
	let kill = function(message) {
		helper.log(message, "red");
		process.exit(1);
	};

	Promise.all([
		exec.local("which rsync || exit 1"),
		exec.local("which git || exit 1")
		])
		.then(() => {
			// Prepare current configuration
			let fileConfig = require(path).config,
				config = helper.merge(constant.default, fileConfig.default, fileConfig[env]);

			if (config.servers === undefined) {
				kill("servers is required.");
			} else if (Array.isArray(config.servers) === false) {
				kill("servers must be an array");
			}

			for (let i = config.servers.length - 1; i >= 0; i--) {
				let server = config.servers[i];

				if (server.user === undefined || typeof server.user != "string") {
					kill("servers." + i.toString() + ".user must be a string");
				} else if (server.host === undefined || typeof server.host != "string") {
					kill("servers." + i.toString() + ".host must be a string");
				} else if (server.to === undefined || typeof server.to != "string") {
					kill("servers." + i.toString() + ".to must be a string");
				}
			}

			if (typeof config.repository === "object" && config.repository !== null && config.repository.url !== null && (config.repository.branch === null && config.repository.tag === null)) {
				kill("repository.branch or repository.tag is required.");
			}

			return {
				config: config,
				file: path
			};
		}).then((options) => {
			return exec.local('date +"%Y%d%m%H%M%S"')
				.then((response) => {
					options.config.internal = {
						release: response.split("\n")[0]
					};

					return options;
				});
		})
		.then(_run)
		.then(() => {
			helper.console.emit("end");
		})
		.catch((error) => {
			kill(error.cmd, "red");
		});

	return helper.console;
};

function _run(options) {
	return Promise.resolve(options)
		.then(_one.bind(null, "init"))
		.then(_one.bind(null, "local"))
		.then((config) => {
			let configs = [];
			for (let i = 0; i < config.servers.length; i++) {
				let server = config.servers[i];

				let configCloned = JSON.parse(JSON.stringify(config));
				configCloned.internal.server = server;

				configs.push(configCloned);
			}

			return configs;
		})
		.then(_all.bind(null, "send"))
		.then(_all.bind(null, "shared"))
		.then(_all.bind(null, "remote"))
		.then(_all.bind(null, "deploy"))
		.then(_all.bind(null, "postDeploy"))
		.then(_all.bind(null, "clean"))
		.catch((error) => {
			helper.console.emit("error", error);
		});
}

function _all(workflow, configs) {
	let _ = require(`./workflow/${workflow}.js`),
		promises = [];

	for (let i in configs) {
		promises.push(_(configs[i]));
	}

	return Promise.all(promises);
}

function _one(workflow, config) {
	return require(`./workflow/${workflow}.js`)(config);
}

module.exports = Bipbip;
