"use strict";

let constant = require("./constant.js"),
    exec     = require("./exec.js"),
    fs       = require("fs"),
    helper   = require("./helper.js"),
    path     = require("path");

const Bipbip = function(path, env) {
	if (exec.local("which rsync") == "rsync:\n") {
		helper.log("Missing rsync", "red");
		process.exit(1);
	}

	if (exec.local("which git") == "git:\n") {
		helper.log("Missing git", "red");
		process.exit(1);
	}

	// Prepare current configuration
	let fileConfig = require(path).config,
		envConfig = helper.merge(constant.default, fileConfig.default, fileConfig[env]),
		kill = function(message) {
			helper.log(message, "red");
			process.exit(1);
		};

	if (envConfig.servers === undefined) {
		kill("servers is required.");
	} else if (Array.isArray(envConfig.servers) === false) {
		kill("servers must be an array");
	}

	for (let i = envConfig.servers.length - 1; i >= 0; i--) {
		let server = envConfig.servers[i];

		if (server.user === undefined || typeof server.user != "string") {
			kill("servers." + i.toString() + ".user must be a string");
		} else if (server.host === undefined || typeof server.host != "string") {
			kill("servers." + i.toString() + ".host must be a string");
		} else if (server.to === undefined || typeof server.to != "string") {
			kill("servers." + i.toString() + ".to must be a string");
		}
	}

	if (typeof envConfig.repository === "object" && envConfig.repository !== null && envConfig.repository.url !== null && (envConfig.repository.branch === null && envConfig.repository.tag === null)) {
		kill("repository.branch or repository.tag is required.");
	}

	this.config = envConfig;
	this.config.internal = {
		release: exec.local('date +"%Y%d%m%H%M%S"').split("\n")[0]
	};
	this.file = path;
};

Bipbip.prototype.run = function() {
	if (this.config.repository !== null && this.config.repository.url !== null) {
		this.init();
	} else {
		this.config.workspace = path.dirname(this.file);
	}

	return Promise.resolve(this.config)
		.then(require("./workflow/local.js"))
		.then((config) => {
			let configs = [];
			for (var i = 0; i < config.servers.length; i++) {
				let server = config.servers[i];

				let configCloned = JSON.parse(JSON.stringify(config));
				configCloned.server = server;

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
			console.error(error);
		});
};

Bipbip.prototype.init = function() {
	if (fs.existsSync(this.config.workspace) === true) {
		try {
			exec.local("git rev-parse --git-dir", {
				cwd: this.config.workspace,
			});
		} catch (err) {
			fs.rmdirSync(this.config.workspace);
		}

		exec.local([
			"git reset --hard",
			"git fetch --all",
			"git fetch --tags"
		].join(" && "), {
			cwd: this.config.workspace,
		});

		if (this.config.repository.branch !== null) {
			exec.local(
				`git remote set-branches --add origin ${this.config.repository.branch}`, {
					cwd: this.config.workspace,
				});

			exec.local(
				`[ -n "\`git show-ref refs/heads/${this.config.repository.branch}\`" ] && git checkout -q ${this.config.repository.branch} || git checkout -b ${this.config.repository.branch} origin/${this.config.repository.branch}`, {
				cwd: this.config.workspace,
			});

			exec.local(
				`git pull origin ${this.config.repository.branch}`, {
				cwd: this.config.workspace,
			});
		} else if (this.config.repository.tag !== null)  {
			exec.local(
				`git checkout -q refs/tags/${this.config.repository.tag}`, {
				cwd: this.config.workspace,
			});
			
			exec.local(
				`git pull origin ${this.config.repository.tag}`, {
				cwd: this.config.workspace,
			});
		}
	} else {
		let gitOption = "";
		if (this.config.repository.options.submodules === true) {
			gitOption += " --recursive";
		}

		exec.local(`git clone -b ${this.config.repository.branch} ${this.config.repository.url} --depth=1 ${this.config.workspace} ${gitOption}`);
	}
};

function _all(workflow, configs) {
	let _ = require(`./workflow/${workflow}.js`),
		promises = [];

	for (let i in configs) {
		promises.push(_(configs[i]));
	}

	return Promise.all(promises);
}

module.exports = Bipbip;
