const package = require("../package.json");

exports.config = {
	default: {
		commands:  {
			local: [
				"echo 'Local command'"
			],
			remote: [
				"echo 'Remote command'"
			],
			postDeploy: [
				"echo 'Post deploy command'"
			]
		},
		ignores: [
		],
		shared: {
			files: [
				"file_to_share"
			],
			folders: [
				"folder_to_share"
			]
		},
		releases: 3
	},
	noRepository: {
		servers: [{
			user: "test",
			host: "localhost",
			to: "/home/test/noRepository",
            // port: 22
		}],
	},
	repository: {
		workspace: "/tmp/repository",
		servers: [{
			user: "test",
			host: "localhost",
			to: "/home/test/repository"
		}],
		repository: {
			url: "https://github.com/baptistedonaux/bipbip.js.git",
			tag: `v${package.version}`
		}
	}
};
