var child_process = require("child_process"),
	fs            = require("fs"),
	util          = require("util")

Bipbip = function(path, env) {
	if (this._execLocal("whereis rsync") == "rsync:\n") {
		Bipbip._log("Missing rsync", "red")
		process.exit(1)
	}

	var fileConfig = require(path).config,
		envConfig = fileConfig.default;

	for (var option in fileConfig[env]) {
		envConfig[option] = fileConfig[env][option];
	}

	this.config = envConfig
	this.internal = {
		release: Date.now(),
	}
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
			this._execLocal("git rev-parse --git-dir", {
				cwd: this.config.workspace,
			});
		} catch (err) {
			fs.rmdirSync(this.config.workspace)
		}

		this._execLocal([
			"git reset --hard",
			"git remote set-branches --add origin " + this.config.repository.branch,
			"git fetch --all"
		].join(" && "), {
			cwd: this.config.workspace,
		});

		this._execLocal(
			"[ -n \"`git show-ref refs/heads/" + this.config.repository.branch + "`\" ] && git checkout -q " + this.config.repository.branch + " || git checkout -b " + this.config.repository.branch + " origin/" + this.config.repository.branch, {
			cwd: this.config.workspace,
		});

		this._execLocal(
			"git pull origin " + this.config.repository.branch, {
			cwd: this.config.workspace,
		});
	} else {
		this._execLocal("git clone -b " + this.config.repository.branch + " " + this.config.repository.url + " --depth=1 " + this.config.workspace);
	}
};

Bipbip.prototype.local = function() {
	if (this.config.commands.local.length > 0) {
		for (var i = 0; i < this.config.commands.local.length; i++) {
		    this._execLocal(this.config.commands.local[i], {
		    	cwd: this.config.workspace,
		    });
		}
	}
};

Bipbip.prototype.send = function() {
	var remotePath = this.config.server.to + "/releases/" + this.internal.release,

		lastRelease = this._execRemote("ls -1 " + this.config.server.to + "/releases | sort -r | head -n 1")

	this._execRemote("mkdir -p " + remotePath)

	this._execRemote(
		this._buildMkdir(
			this.config.server.to + "/shared"
			)
		)

	if (lastRelease != "") {
		var mkdirRemotePath = [
			"cp -R " + this.config.server.to + "/releases/" + lastRelease,
			remotePath
			].join(" ");

		this._execRemote(mkdirRemotePath)
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
	
	this._execLocal(cmd)
};

Bipbip.prototype.shared = function() {
	for (var i = this.config.shared.folders.length - 1; i >= 0; i--) {
		this._execRemote(
			this._buildMkdir(
				this.config.server.to + "/shared/" + this.config.shared.folders[i]
				)
			)

		this._execRemote(
			this._buildLn(
				this.config.server.to + "/shared/" + this.config.shared.folders[i],
				this.config.server.to + "/releases/" + this.internal.release + "/" + this.config.shared.folders[i]
				)
			)
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
			this._buildMkdir(
				this.config.server.to + "/shared/" + folder
				)
			)

		if (file != "/") {
			this._execRemote(
				this._buildTouch(
					this.config.server.to + "/shared/" + folder + file
					)
				)

			this._execRemote(
				this._buildLn(
					this.config.server.to + "/shared/" + this.config.shared.files[i],
					this.config.server.to + "/releases/" + this.internal.release + "/" + this.config.shared.files[i]
					)
				)
		} else {
			this._execRemote(
				this._buildLn(
					this.config.server.to + "/shared/" + folder,
					this.config.server.to + "/releases/" + this.internal.release + "/" + folder
					)
				)
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
	this._execRemote("rm -f " + this.config.server.to + "/current && ln -s " + this.config.server.to + "/releases/" + this.internal.release + " " + this.config.server.to + "/current")
};

Bipbip.prototype.clean = function() {
	var nbReleases = this._execRemote("ls -1 " + this.config.server.to + "/releases | wc -l")
	if (nbReleases > this.config.releases) {
		var nbToDelete = nbReleases - this.config.releases


		var releasesToDelete = this._execRemote("ls -1 " + this.config.server.to + "/releases --sort=time | sort -r | tail --lines=" + nbToDelete.toString(), false)
		releasesToDelete = releasesToDelete.split("\n")

		var folders = [];
		for (var i = releasesToDelete.length - 1; i >= 0; i--) {
			if (releasesToDelete[i].length > 0) {
				folders[folders.length] = this.config.server.to + "/releases/" + releasesToDelete[i]
			}
		};

		this._execRemote("rm -rf " + folders.join(" "))
	}
};

Bipbip._log = function (message, color) {
	if (color == "grey") {
		color = 30;
	} else if (color == "red") {
		color = 31;
	} else if (color == "green") {
		color = 32;
	} else if (color == "orange") {
		color = 33;
	} else if (color == "blue") {
		color = 34;
	} else if (color == "purple") {
		color = 35;
	} else if (color == "mint") {
		color = 36;
	} else {
		color = 0;
	}

	util.log('\x1B[' + color + 'm> ' + message + '\x1B[39m')
};

Bipbip.prototype._execLocal = function(command, options) {
	if (options === undefined) {
		options = {}
	}

	Bipbip._log(command, "green")

	var response = child_process.execSync(command, options)
	response = new Buffer(response).toString()

	Bipbip._log(response, "mint")

	return response
}

Bipbip.prototype._execRemote = function(command, escape) {
	command =  ["ssh", [this.config.server.user, this.config.server.host].join("@")].join(" ") + " '" + command + "'"
	Bipbip._log(command, "green")

	var response = child_process.execSync(command)
	response = new Buffer(response).toString()

	if (escape === undefined || escape === true) {
		response = response.replace("\n", "")
	}

	Bipbip._log(response, "mint")

	return response
}

Bipbip.prototype._buildLn = function(from, to) {
	return [
		"[ -L " + to + " ]",
		"|| ln -s " + from + " " + to
	].join(" ")
};

Bipbip.prototype._buildTouch = function(to) {
	return [
		"[ -e " + to + " ]",
		"|| touch " + to
	].join(" ")
};

Bipbip.prototype._buildMkdir = function(to) {
	return [
		"[ -d " + to + " ]",
		"|| mkdir -p " + to
	].join(" ")
};

module.exports = Bipbip;
