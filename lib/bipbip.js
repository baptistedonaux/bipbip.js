"use strict";

var child_process = require("child_process"),
	fs            = require("fs"),
	helper        = require("./helper.js"),
	cluster		  = require("cluster");

var Bipbip = function(path, env) {
	if (Bipbip._execLocal("whereis rsync") == "rsync:\n") {
		helper.log("Missing rsync", "red");
		process.exit(1);
	}

	if (Bipbip._execLocal("whereis git") == "git:\n") {
		helper.log("Missing git", "red");
		process.exit(1);
	}

	// Prepare current configuration
	var fileConfig = require(path).config,
		envConfig = helper.merge(Bipbip.default, fileConfig.default, fileConfig[env]);

	var checkRequiredFunction = function(option, value, parents) {
		if (parents === undefined) {
			parents = [];
		}

		if (typeof value === "object") {
			for (var child in value) {
				checkRequiredFunction(
					child,
					value[child],
					parents.concat(option));
			}
		} else {
			var valueTracked = envConfig;

			parents.push(option);

			parents.forEach(function (parent) {
				if (valueTracked !== undefined && typeof valueTracked === "object") {
					valueTracked = valueTracked[parent]
				}
			});

			if (valueTracked === undefined || valueTracked === null || valueTracked === "") {
				helper.log(parents.join(".") + " is required. " + value, "red");
				process.exit(1);
			};
		}
	}

	// Check the current configuration
	for (var option in Bipbip.required) {
		checkRequiredFunction(option, Bipbip.required[option]);
	}

	this.config = envConfig;
	this.internal = {
		release: Bipbip._execLocal('date +"%Y%d%m%H%M%S"').split("\n")[0]
	};
};

Bipbip.prototype.run = function() {
	this.init();
	this.local();
	this.send();
	this.shared();
	this.remote();
	this.deploy();
	this.clean();
};

Bipbip.prototype.init = function() {
	if (fs.existsSync(this.config.workspace) === true) {
		try {
			Bipbip._execLocal("git rev-parse --git-dir", {
				cwd: this.config.workspace,
			});
		} catch (err) {
			fs.rmdirSync(this.config.workspace);
		}

		Bipbip._execLocal([
			"git reset --hard",
			"git remote set-branches --add origin " + this.config.repository.branch,
			"git fetch --all"
		].join(" && "), {
			cwd: this.config.workspace,
		});

		Bipbip._execLocal(
			"[ -n \"`git show-ref refs/heads/" + this.config.repository.branch + "`\" ] && git checkout -q " + this.config.repository.branch + " || git checkout -b " + this.config.repository.branch + " origin/" + this.config.repository.branch, {
			cwd: this.config.workspace,
		});

		Bipbip._execLocal(
			"git pull origin " + this.config.repository.branch, {
			cwd: this.config.workspace,
		});
	} else {
		Bipbip._execLocal("git clone -b " + this.config.repository.branch + " " + this.config.repository.url + " --depth=1 " + this.config.workspace);
	}
};

Bipbip.prototype.local = function() {
	if (this.config.commands.local.length > 0) {
		for (var i = 0; i < this.config.commands.local.length; i++) {
		    Bipbip._execLocal(this.config.commands.local[i], {
		    	cwd: this.config.workspace,
		    });
		}
	}
};

Bipbip.prototype.send = function() {
	var remotePath = this.config.server.to + "/releases/" + this.internal.release;
	var lastRelease = this._execRemote("ls -1 " + this.config.server.to + "/releases | sort -r | head -n 1");

	this._execRemote("mkdir -p " + this.config.server.to + "/releases");

	this._execRemote(
		helper.mkdir(
			this.config.server.to + "/shared"
			));

	if (lastRelease !== "") {
		var mkdirRemotePath = [
			"cp -R " + this.config.server.to + "/releases/" + lastRelease,
			remotePath
			].join(" ");

		this._execRemote(mkdirRemotePath);
	}

	var cmd = [
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
				this.config.server.user, this.config.server.host].join("@"),
				remotePath
			].join(":")
		].join(" ");
	
	Bipbip._execLocal(cmd)
};

Bipbip.prototype.shared = function() {
	for (var i = this.config.shared.folders.length - 1; i >= 0; i--) {
		this._execRemote(
			helper.mkdir(
				this.config.server.to + "/shared/" + this.config.shared.folders[i]
				)
			)

		this._execRemote(
			helper.ln(
				this.config.server.to + "/shared/" + this.config.shared.folders[i],
				this.config.server.to + "/releases/" + this.internal.release + "/" + this.config.shared.folders[i]
				)
			);
	};

	for (var i = this.config.shared.files.length - 1; i >= 0; i--) {
		var folder = this.config.shared.files[i].substr(
			0,
			this.config.shared.files[i].lastIndexOf("/")
			);

		var file = this.config.shared.files[i].substr(
			this.config.shared.files[i].lastIndexOf("/")
			);

		this._execRemote(
			helper.mkdir(
				this.config.server.to + "/shared/" + folder
				)
			)

		if (file != "/") {
			this._execRemote(
				helper.touch(
					this.config.server.to + "/shared/" + folder + file
					)
				);

			this._execRemote(
				helper.ln(
					this.config.server.to + "/shared/" + this.config.shared.files[i],
					this.config.server.to + "/releases/" + this.internal.release + "/" + this.config.shared.files[i]
					)
				);
		} else {
			this._execRemote(
				helper.ln(
					this.config.server.to + "/shared/" + folder,
					this.config.server.to + "/releases/" + this.internal.release + "/" + folder
					)
				);
		}
	};
};

Bipbip.prototype.remote = function() {
	if (this.config.commands.remote.length > 0) {
		for (var i = 0; i < this.config.commands.remote.length; i++) {
		    this._execRemote("cd " + this.config.server.to + "/releases/" + this.internal.release + " && " + this.config.commands.remote[i]);
		}
	}
};

Bipbip.prototype.deploy = function() {
	this._execRemote("rm -f " + this.config.server.to + "/current && ln -s " + this.config.server.to + "/releases/" + this.internal.release + " " + this.config.server.to + "/current");
};

Bipbip.prototype.clean = function() {
	var nbReleases = this._execRemote("ls -1 " + this.config.server.to + "/releases | wc -l");
	if (nbReleases > this.config.releases) {
		var nbToDelete = nbReleases - this.config.releases;


		var releasesToDelete = this._execRemote("ls -1 " + this.config.server.to + "/releases --sort=time | sort -r | tail --lines=" + nbToDelete.toString(), false);
		releasesToDelete = releasesToDelete.split("\n");

		var folders = [];
		for (var i = releasesToDelete.length - 1; i >= 0; i--) {
			if (releasesToDelete[i].length > 0) {
				folders[folders.length] = this.config.server.to + "/releases/" + releasesToDelete[i];
			}
		}

		this._execRemote("rm -rf " + folders.join(" "));
	}
};

Bipbip._execLocal = function(command, options) {
	if (options === undefined) {
		options = {};
	}

	if (Array.isArray(command) === true) {
		for (var i = 0; i < command.length; i++) {
			cluster.setupMaster({
				exec: __dirname + "/bipbip.js",
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

		Bipbip._execLocal("while " + cmds.join(" && ") + "; do sleep 1 ; done");

		console.log("Workers finished jobs");
	} else {
		helper.log(command, "green");

		var response = child_process.execSync(command, options);
		response = new Buffer(response).toString();

		helper.log(response, "mint");
	};

	return response;
}

Bipbip.prototype._execRemote = function(command, escape) {
	command =  ["ssh", [this.config.server.user, this.config.server.host].join("@")].join(" ") + " '" + command + "'";
	helper.log(command, "green");

	var response = child_process.execSync(command);
	response = new Buffer(response).toString();

	if (escape === undefined || escape === true) {
		response = response.replace("\n", "");
	}

	helper.log(response, "mint");

	return response;
}

Bipbip.required = {
	workspace: "Folder to build project before deploy on remote server",
	server: {
		user: "User to connect the remote server",
		host: "Server to deploy",
		to: "Absolute path where deploy"
	},
	repository: {
		url: "Source Git repository",
		branch: "Source Git branch"
	}
};

Bipbip.default = {
	commands:  {
		local: [],
		remote: []
	},
	ignores: [],
	shared: {
		files: [],
		folders: []
	},
	releases: 3
};

if (cluster.isWorker === true) {
	var options = process.argv.slice(2)[0];
	options = JSON.parse(options);

	Bipbip._execLocal(options.command, options.options);

	console.log("End of child");

	process.exit(0);
}

module.exports = Bipbip;
