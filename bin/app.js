#!/usr/bin/env node

'use strict';

const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const program = require('commander');
const fs = require('fs-extra');
const uuid = require('uuid/v1')
const daemonize = require('daemonize-process');
const chalk = require('chalk');

const { Handler, Logger, LogLevel, rand } = require(path.join(__dirname, '../index.js'));

const pkg = require(path.join(__dirname, '../package.json'));
const logger = new Logger('APP', { minConsoleLevel: 'info', minFileLevel: 'silly', maxSize: 10485760 });

logger.on('message', (info) => {
	if (new LogLevel(info.level).value <= new LogLevel(logger.minConsoleLevel).value) {
		console.log(`${info.timestamp} [${info.label}] ${Logger.colorize(info.level, `${info.level}: ${info.message}`)}`);
	}

	if (new LogLevel(info.level).value <= new LogLevel(logger.minFileLevel).value) {
		let file = path.join(__dirname, '../logs/application.log');
		if (fs.existsSync(file) && fs.statSync(file).size >= logger.maxSize) { fs.removeSync(file); }
		fs.writeFileSync(file, `${info.timestamp} [${info.label}] ${info.level}: ${info.message}\n`, { flag: 'a' });
	}
});

function buildHandler(name, handlerInfo, logLevel) {
	let id = uuid();

	if (!path.isAbsolute(handlerInfo.script)) { handlerInfo.script = path.join(__dirname, '../handlers', handlerInfo.script); }
	if (!path.isAbsolute(handlerInfo.config)) { handlerInfo.config = path.join(__dirname, '../handlers', handlerInfo.config); }
	logger.log('debug', `Handler script @ ${handlerInfo.script}`);
	logger.log('debug', `Handler config @ ${handlerInfo.config}`);

	let func = require(handlerInfo.script),
			opts = require(handlerInfo.config);

	opts.id = id;
	opts.name = name;
	opts.logLevel = logLevel;

	logger.log('debug', `Handler id is '${opts.id}'`);
	logger.log('debug', `Handler name is '${opts.name}'`);

	return new Handler(func, opts);
}

async function runHandlers(handlers, queries, config) {
	let finished = 0,
			current = 0,
			running = [];
	while (finished < handlers.length) {
		if (running.length < config.maxHandlers && current < handlers.length) {
			logger.log('debug', `Adding handler '${handlers[current].name()}' to queue.`);
			running.push(handlers[current].handle(queries[rand(0, queries.length)]));
			++current;
		}
		else {
			logger.log('debug', `Awaiting ${running.length} handlers.`);
			for (let i = 0; i < running.length; ++i) {
				logger.log('debug', `Handler '${handlers[finished + i].name()}' returned ${await running[i]}`);
			}
			finished += running.length;
			logger.log('debug', `Finished ${finished} handlers.`);
			running = [];
		}
	}
}

async function daemonRun(handlers, queries, config, loop) {
	let next = 0;

	do {
		if (next < Date.now()) {
			await runHandlers(handlers, queries, config);
			next = Date.now() + rand(1, config.jitter + 1) * 60000;
			logger.log('info', 'All handlers finished.');
			if (loop) { logger.log('info', `Next run @ ${new Date(next).toLocaleString()}`); }
			console.log();
		}
	} while (loop);
}

fs.ensureFileSync(path.join(os.homedir(), `.${pkg.name}`));
fs.ensureFileSync(path.join(__dirname, '../logs/application.log'));

program.name(pkg.name)
			 .version(pkg.version)
			 .description(pkg.description)
			 .usage('[options]')
			 .option('-c, --config <path>', 'A configuration file to use in place of the configuration file in your home directory')
			 .option('-q, --queries <path>', 'A list of search terms to pass to handlers. If no list is provided a default list is used')
			 .option('-v, --verbose [loglevel]', 'Display verbose output. Log level will default to \'verbose\'')
			 .option('-l, --loop', 'Run in a loop even if the process is not a daemon')
			 .option('-d, --daemonize', 'Run in the background as a daemon. Handlers will run periodically based on the \'jitter\' setting')
			 .parse(process.argv);

try {
	const config = {},
				handlers = [];

	if (program.verbose) {
		if (typeof(program.verbose) !== 'string') { program.verbose = 'verbose'; }
		logger.minConsoleLevel = program.verbose.toLowerCase();
		logger.log('debug', `Log level is ${program.verbose}.`);
	}
	if (program.daemonize) {
		logger.log('debug', 'Daemonizing process.');
		daemonize();
		logger.log('debug', `Running as daemon with ${JSON.stringify(process.argv)}`);
	}
	if (program.config) { logger.log('debug', 'Custom configuration set.'); }
	if (process.ppid) { logger.log('debug', 'Running in daemon mode.'); }
	logger.log('info', 'Loading configuration.');
	Object.assign(config, require(path.join(__dirname, '../config.json')));
	Object.assign(config, require(program.config || path.join(
																														os.homedir(),
																														`.${pkg.name}`
																													)
																));

	logger.log('info', 'Loading queries.');
	const queries = fs.readFileSync(
																	program.queries ? program.queries
																									: path.join(
																															__dirname,
																															'../queries.list'
																														),
																	{ encoding: 'utf-8' }
																).trim().split(/\n|\r\n/gi);
	logger.log('debug', `Queries are ${JSON.stringify(queries)}`);

	logger.log('info', 'Loading handlers.');
	for (let handlerName in config.handlers) {
		let handler = buildHandler(handlerName, config.handlers[handlerName], program.verbose || 'info');
		handler.on('begin', () => { logger.log('info', `Running '${handlerName}' handler.`); })
					 .on('complete', () => { logger.log('info', `'${handlerName}' finished.`); });
		handlers.push(handler);
		logger.log('info', `Loaded '${handlerName}' handler.`);
	}

	logger.log('info', 'Running handlers.');
	if (!config.maxHandlers) { config.maxHandlers = os.cpus().length; }
	logger.log('debug', `Running in ${program.daemonize || program.loop ? 'Loop' : 'RunOnce'} mode.`);
	daemonRun(handlers, queries, config, program.daemonize || program.loop);

}
catch (err) {
	logger.log('error', err);
	logger.log('debug', err.stack);
	program.help();
}
