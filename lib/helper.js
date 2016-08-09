"use strict";

const moment  = require("moment"),
	os        = require("os");

let user = require("process").env.USER || "";

module.exports.log = function(message, color, server) {
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

	let hostname = os.hostname();
	if (server !== undefined && server.host !== undefined && server.user !== undefined) {
		hostname = server.host;
		user = server.user;
	}

	console.info('\x1B[' + color + 'm> [' + moment().format("DD/MM/YY HH:mm:ss") + '] [' + user + '@' + hostname + '] ' + message + '\x1B[39m');
};

module.exports.ln = function(from, to) {
	return [
		"[ -L " + to + " ]",
		"|| ln -s " + from + " " + to
	].join(" ");
};

module.exports.touch = function(to) {
	return [
		"[ -e " + to + " ]",
		"|| touch " + to
	].join(" ");
};

module.exports.mkdir = function() {
	let args = arguments;
	
	args = Object.keys(args).map(function(key) {
		return args[key];
	});

	return `mkdir -p ${args.join(" ")}`;
};

// @todo View underscore.js
module.exports.merge = function() {
    let merge = {};

    for (let i = 0; i < arguments.length; i++) {
        for (let tmp in arguments[i]) {
			if (arguments[i][tmp] === null) {
				merge[tmp] = null;
			} else if (typeof arguments[i][tmp] === "object") {
				if (merge[tmp] === undefined) {
					merge[tmp] = arguments[i][tmp];
				} else {
					for (let item in arguments[i][tmp]) {
						merge[tmp][item] = arguments[i][tmp][item];
					}
				}
			} else {
            	merge[tmp] = arguments[i][tmp];
			}
        }
    }

    return merge;
};