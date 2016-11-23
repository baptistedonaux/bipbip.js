"use strict";

const file  = require("./shared/file.js"),
    folder  = require("./shared/folder.js");

module.exports = (config) => {
    return Promise.resolve(config)
        .then(folder)
        .then(file);
};
