#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const pkg = require(path.join(__dirname, '../package.json'));

for (let entry of fs.readdirSync(os.homedir())) {
	if (entry.match(/\.json$/gi) && entry.indexOf(pkg.name) !== -1) {
		let file = path.join(os.homedir(), entry);
		let proc = fs.readJSONSync(file);
		try {
			process.kill(proc.pid);
		}
		catch (err) {
			console.error(err);
		}
		if (process.platform === 'win32' && fs.existsSync(file)) {
				fs.unlinkSync(file);
		}
	}
}
