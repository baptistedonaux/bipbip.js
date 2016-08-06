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
	this.send(
		Bipbip.prototype.shared.bind(
			this,
			Bipbip.prototype.remote.bind(this)
		)
	);
	
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

Bipbip.prototype.send = function(callback) {
	let _this = this;

	let _ = function(server) {
		let remotePath = server.to + "/releases/" + _this.internal.release;
		let lastRelease = _this._execRemote(server, "ls -1t " + server.to + "/releases | head -n 1");

		_this._execRemote(server, "mkdir -p " + server.to + "/releases");

		_this._execRemote(
			server,
			helper.mkdir(
				server.to + "/shared"
				));

		if (lastRelease !== "") {
			let mkdirRemotePath = [
				"cp -R " + server.to + "/releases/" + lastRelease,
				remotePath
				].join(" ");

			_this._execRemote(server, mkdirRemotePath);
		}

		let cmd = [
			"rsync",
			"-az",
			"--delete",
			_this.config.ignores.map(function (item) {
				return "--exclude=" + item;
			}).join(" "),
			_this.config.shared.files.map(function (item) {
				return "--exclude=" + item;
			}).join(" "),
			_this.config.shared.folders.map(function (item) {
				return "--exclude=" + item;
			}).join(" "),
			_this.config.workspace + "/",
			[
				[
					server.user, server.host].join("@"),
					remotePath
				].join(":")
			].join(" ");
		
		exec.local(cmd);
	};

	let promises = this.config.servers.map((server) => {
		return new Promise((resolve, reject) => {
			_(server);

			resolve();
		});
	});

	Promise
		.all(promises)
		.then((content) => {
			callback();
		}).catch((error) => {
			console.error(error);
		});
};

Bipbip.prototype.shared = function(callback) {
	let _this = this;

	let _ = function(server) {
		for (let i = _this.config.shared.folders.length - 1; i >= 0; i--) {
			_this._execRemote(
				server,
				helper.mkdir(
					server.to + "/shared/" + _this.config.shared.folders[i]
					)
				);

			_this._execRemote(
				server,
				helper.ln(
					server.to + "/shared/" + _this.config.shared.folders[i],
					server.to + "/releases/" + _this.internal.release + "/" + _this.config.shared.folders[i]
					)
				);
		}

		for (let i = _this.config.shared.files.length - 1; i >= 0; i--) {
			let folder = _this.config.shared.files[i].substr(
				0,
				_this.config.shared.files[i].lastIndexOf("/")
				);

			let file = _this.config.shared.files[i].substr(
				_this.config.shared.files[i].lastIndexOf("/")
				);

			_this._execRemote(
				server,
				helper.mkdir(
					server.to + "/shared/" + folder
					)
				);

			if (file != "/") {
				_this._execRemote(
					server,
					helper.touch(
						server.to + "/shared/" + folder + file
						)
					);

				_this._execRemote(
					server,
					helper.ln(
						server.to + "/shared/" + _this.config.shared.files[i],
						server.to + "/releases/" + _this.internal.release + "/" + _this.config.shared.files[i]
						)
					);
			} else {
				_this._execRemote(
					server,
					helper.ln(
						server.to + "/shared/" + folder,
						server.to + "/releases/" + _this.internal.release + "/" + folder
						)
					);
			}
		}
	};

	let promises = this.config.servers.map((server) => {
		return new Promise((resolve, reject) => {
			_(server);

			resolve();
		});
	});

	Promise
		.all(promises)
		.then((content) => {
			callback();
		}).catch((error) => {
			console.error(error);
		});
};

Bipbip.prototype.remote = function() {
	let _this = this;

	let _ = function(server) {
		if (_this.config.commands.remote.length > 0) {
			for (let i = 0; i < _this.config.commands.remote.length; i++) {
			    _this._execRemote(
			    	server,
			    	"cd " + server.to + "/releases/" + _this.internal.release + " && " + _this.config.commands.remote[i]
			    	);
			}
		}
	};

	for (let i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.deploy = function() {
	let _this = this;

	let _ = function(server) {
		_this._execRemote(
			server,
			"rm -f " + server.to + "/current && ln -s " + server.to + "/releases/" + _this.internal.release + " " + server.to + "/current"
			);
	};

	for (let i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.postDeploy = function() {
	let _this = this;

	let _ = function(server) {
		if (_this.config.commands.postDeploy.length > 0) {
			for (let i = 0; i < _this.config.commands.postDeploy.length; i++) {
			    _this._execRemote(
			    	server,
			    	"cd " + server.to + "/releases/" + _this.internal.release + " && " + _this.config.commands.postDeploy[i]
			    	);
			}
		}
	};

	for (let i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype.clean = function() {
	let _this = this;

	let _ = function(server) {
		_this._execRemote(
			server,
			"ls -1dt " + server.to + "/releases/* | tail -n +" + (_this.config.releases + 1).toString() + " | xargs rm -rf"
			);
	};

	for (let i = this.config.servers.length - 1; i >= 0; i--) {
		_(this.config.servers[i]);
	}
};

Bipbip.prototype._execRemote = function(server, command, escape) {
	return exec.remote(server, command, escape);
};

module.exports = Bipbip;
