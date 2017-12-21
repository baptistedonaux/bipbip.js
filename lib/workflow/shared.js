"use strict";

const file  = require("./shared/file.js"),
    folder  = require("./shared/folder.js");

module.exports = (config) => {
    config.internal.write("\n>> Plug folders/files to share");

    return Promise.resolve(config)
        .then(folder)
        .then(file);
};
