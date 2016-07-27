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
	this.internal = {
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

	this.local();
	this.send();
	this.shared();
	this.remote();
	this.deploy();
	this.postDeploy();
	this.clean();
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
				"git remote set-branches --add origin " + this.config.repository.branch, {
					cwd: this.config.workspace,
				});

			exec.local(
				"[ -n \"`git show-ref refs/heads/" + this.config.repository.branch + "`\" ] && git checkout -q " + this.config.repository.branch + " || git checkout -b " + this.config.repository.branch + " origin/" + this.config.repository.branch, {
				cwd: this.config.workspace,
			});

			exec.local(
				"git pull origin " + this.config.repository.branch, {
				cwd: this.config.workspace,
			});
		} else if (this.config.repository.tag !== null)  {
			exec.local(
				"git checkout -q refs/tags/" + this.config.repository.tag, {
				cwd: this.config.workspace,
			});
			
			exec.local(
				"git pull origin " + this.config.repository.tag, {
				cwd: this.config.workspace,
			});
		}
	} else {
		let gitOption = "";
		if (this.config.repository.options.submodules === true) {
			gitOption += " --recursive";
		}

		exec.local("git clone -b " + this.config.repository.branch + " " + this.config.repository.url + " --depth=1 " + this.config.workspace + gitOption);
	}
};

Bipbip.prototype.local = function() {
	if (this.config.commands.local.length > 0) {
		for (let i = 0; i < this.config.commands.local.length; i++) {
		    exec.local(this.config.commands.local[i], {
		    	cwd: this.config.workspace,
		    });
		}
	}
};

Bipbip.prototype.send = function() {
	let _ = function(server) {
		let remotePath = server.to + "/releases/" + this.internal.release;
		let lastRelease = this._execRemote(server, "ls -1t " + server.to + "/releases | head -n 1");

		this._execRemote(server, "mkdir -p " + server.to + "/releases");

		this._execRemote(
			server,
			helper.mkdir(
				server.to + "/shared"
				));

		if (lastRelease !== "") {
			let mkdirRemotePath = [
				"cp -R " + server.to + "/releases/" + lastRelease,
				remotePath
				].join(" ");

			this._execRemote(server, mkdirRemotePath);
		}

		let cmd = [
			"rsync",
			"-az",
			"--delete",
			this.config.ignores.map(function (item) {
				return "--exclude=" + item;
			}).join(" "),
			this.config.shared.files.map(function (item) {
				return "--exclude=" + item;
			}).join(" "),
			this.config.shared.folders.map(function (item) {
				return "--exclude=" + item;
			}).join(" "),
			this.config.workspace + "/",
			[
				[
					server.user, server.host].join("@"),
					remotePath
				].join(":")
			].join(" ");
		
		exec.local(cmd);
	};

	for (var i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.shared = function() {
	let _ = function(server) {
		for (let i = this.config.shared.folders.length - 1; i >= 0; i--) {
			this._execRemote(
				server,
				helper.mkdir(
					server.to + "/shared/" + this.config.shared.folders[i]
					)
				);

			this._execRemote(
				server,
				helper.ln(
					server.to + "/shared/" + this.config.shared.folders[i],
					server.to + "/releases/" + this.internal.release + "/" + this.config.shared.folders[i]
					)
				);
		}

		for (let i = this.config.shared.files.length - 1; i >= 0; i--) {
			let folder = this.config.shared.files[i].substr(
				0,
				this.config.shared.files[i].lastIndexOf("/")
				);

			let file = this.config.shared.files[i].substr(
				this.config.shared.files[i].lastIndexOf("/")
				);

			this._execRemote(
				server,
				helper.mkdir(
					server.to + "/shared/" + folder
					)
				);

			if (file != "/") {
				this._execRemote(
					server,
					helper.touch(
						server.to + "/shared/" + folder + file
						)
					);

				this._execRemote(
					server,
					helper.ln(
						server.to + "/shared/" + this.config.shared.files[i],
						server.to + "/releases/" + this.internal.release + "/" + this.config.shared.files[i]
						)
					);
			} else {
				this._execRemote(
					server,
					helper.ln(
						server.to + "/shared/" + folder,
						server.to + "/releases/" + this.internal.release + "/" + folder
						)
					);
			}
		};
	};

	for (var i = servers.length - 1; i >= 0; i--) {
		_(servers[i]);
	}
};

Bipbip.prototype.remote = function() {
	let _ = function(server) {
		if (this.config.commands.remote.length > 0) {
			for (let i = 0; i < this.config.commands.remote.length; i++) {
			    this._execRemote(
			    	server,
			    	"cd " + server.to + "/releases/" + this.internal.release + " && " + this.config.commands.remote[i]
			    	);
			}
		}
	};

	for (var i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.deploy = function() {
	let _ = function(server) {
		this._execRemote("rm -f " + server.to + "/current && ln -s " + server.to + "/releases/" + this.internal.release + " " + server.to + "/current");
	};

	for (var i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.postDeploy = function() {
	let _ = function(server) {
		if (this.config.commands.postDeploy.length > 0) {
			for (let i = 0; i < this.config.commands.postDeploy.length; i++) {
			    this._execRemote("cd " + server.to + "/releases/" + this.internal.release + " && " + this.config.commands.postDeploy[i]);
			}
		}
	};

	for (var i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.clean = function() {
	this._execRemote("ls -1dt " + this.config.server.to + "/releases/* | tail -n +" + (this.config.releases + 1).toString() + " | xargs rm -rf");
};

Bipbip.prototype._execRemote = function(server, command, escape) {
	return exec.remote(server, command, escape);
};

module.exports = Bipbip;
