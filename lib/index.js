"use strict";

var fs       = require("fs"),
    helper   = require("./helper.js"),
    constant = require("./constant.js"),
    exec     = require("./exec.js");

var Bipbip = function(path, env) {
	if (exec.local("whereis rsync") == "rsync:\n") {
		helper.log("Missing rsync", "red");
		process.exit(1);
	}

	if (exec.local("whereis git") == "git:\n") {
		helper.log("Missing git", "red");
		process.exit(1);
	}

	// Prepare current configuration
	var fileConfig = require(path).config,
		envConfig = helper.merge(constant.default, fileConfig.default, fileConfig[env]);

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
					valueTracked = valueTracked[parent];
				}
			});

			if (valueTracked === undefined || valueTracked === null || valueTracked === "") {
				helper.log(parents.join(".") + " is required. " + value, "red");
				process.exit(1);
			}
		}
	}

	// Check the current configuration
	for (var option in constant.required) {
		checkRequiredFunction(option, constant.required[option]);
	}

	if (envConfig.repository.branch === null && envConfig.repository.tag === null) {
		helper.log("repository.branch or repository.tag is required.", "red");
		process.exit(1);
	}

	this.config = envConfig;
	this.internal = {
		release: exec.local('date +"%Y%d%m%H%M%S"').split("\n")[0]
	};
};

Bipbip.prototype.run = function() {
	this.init();
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
		var gitOption = "";
		if (this.config.repository.options.submodules === true) {
			gitOption += " --recursive";
		}

		exec.local("git clone -b " + this.config.repository.branch + " " + this.config.repository.url + " --depth=1 " + this.config.workspace + gitOption);
	}
};

Bipbip.prototype.local = function() {
	if (this.config.commands.local.length > 0) {
		for (var i = 0; i < this.config.commands.local.length; i++) {
		    exec.local(this.config.commands.local[i], {
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
	
	exec.local(cmd);
};

Bipbip.prototype.shared = function() {
	for (var i = this.config.shared.folders.length - 1; i >= 0; i--) {
		this._execRemote(
			helper.mkdir(
				this.config.server.to + "/shared/" + this.config.shared.folders[i]
				)
			);

		this._execRemote(
			helper.ln(
				this.config.server.to + "/shared/" + this.config.shared.folders[i],
				this.config.server.to + "/releases/" + this.internal.release + "/" + this.config.shared.folders[i]
				)
			);
	}

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
			);

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
	}
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

Bipbip.prototype.postDeploy = function() {
	if (this.config.commands.postDeploy.length > 0) {
		for (var i = 0; i < this.config.commands.postDeploy.length; i++) {
		    this._execRemote("cd " + this.config.server.to + "/releases/" + this.internal.release + " && " + this.config.commands.postDeploy[i]);
		}
	}
};

Bipbip.prototype.clean = function() {
	this._execRemote("ls -1d " + this.config.server.to + "/releases/* | sort -r | tail -n +" + (this.config.releases + 1).toString() + " | xargs rm -rf");
};

Bipbip.prototype._execRemote = function(command, escape) {
	return exec.remote(this.config.server, command, escape);
};

module.exports = Bipbip;
