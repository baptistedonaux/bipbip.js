"use strict";

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