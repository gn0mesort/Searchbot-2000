/**
 * This file packs the entire library. It is enough to pull in this file into a
 * project to get everything.
 */
'use strict';

const path = require('path');

const { Handler } = require(path.join(__dirname, 'src/handler.js'));
const {
				Logger,
				LogLevel
			} = require(path.join(__dirname, 'src/logger.js'));
const {
				identify,
				statusCode,
				rand,
				jswait,
				wait,
				click,
				data,
				waitJitter,
				search,
				page,
				scrubTargets
			} = require(path.join(__dirname, 'src/functions.js'));

module.exports = {
	Handler,
	Logger,
	LogLevel,
	identify,
	statusCode,
	rand,
	jswait,
	wait,
	click,
	data,
	waitJitter,
	search,
	page,
	scrubTargets
};
