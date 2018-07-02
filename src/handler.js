'use strict';

const path = require('path');
const EventEmitter = require('events');

const fs = require('fs-extra');
const Nightmare = require('nightmare');

const { statusCode } = require(path.join(__dirname, 'functions.js'));
const { Logger, LogLevel } = require(path.join(__dirname, 'logger.js'));

require('nightmare-download-manager')(Nightmare);

/**
 * Defines a handler.
 * Handlers are fairly arbitrary. They essentially represent plugin modules that
 * are executed by their loading application. Each handler is given certain
 * default features. They are passed a standards options object as well as an
 * instance of nightmare that represents their internal browser state.
 */
class Handler extends EventEmitter {

	constructor(func, opts = { }) {
		super();
		if (!func) { throw new Error('Handler function must be defined.'); }
		if (!opts.logger) { // If no logger is provided define a default logger.
			opts.logger = new Logger(`HANDLER ${opts.name}`,
															 {
																 minConsoleLevel: opts.minConsoleLevel || 
																 									'info',
																 minFileLevel: 'silly',
																 maxSize: 10485760
															 });

			// Bind a default handler for log messages
			opts.logger.on('message', (info) => {
				// If the LogLevel is higher than the minimum for the console
				if (new LogLevel(info.level).value <=
						new LogLevel(opts.logger.minConsoleLevel).value) {
					console.log(`${info.timestamp} [${info.label}]` +
											` ${Logger.colorize(info.level, `${info.level}:` +
											` ${info.message}`)}`
										 );
				}

				// If the LogLevel is higher than the minimum for files
				if (new LogLevel(info.level).value <=
						new LogLevel(opts.logger.minFileLevel).value) {
					let file = path.join(__dirname, `../logs/${opts.name}.log`),
							backup = path.join(__dirname, `../logs/${opts.name}.bak.log`);
					if (fs.existsSync(file) && 
							fs.statSync(file).size >= opts.logger.maxSize) {
						fs.removeSync(backup);
						fs.renameSync(file, backup);
					}
					fs.writeFileSync(file,
													 `${info.timestamp} [${info.label}] ${info.level}: ` +
													 `${info.message}\n`,
													 { flag: 'a' }
													);
				}
			});
		}
		opts.logger.log('debug',
										`Handler '${opts.name}' received ${JSON.stringify(opts)}`
									 );

		/**
		 * Calling handle() will invoke the handler's main function. Multiple
		 * handlers can be run simultaneously.
		 * 
		 * @param {String} query The query value to be passed to the handler.
		 * @returns {Number} A status code indicating the result of the handler.
		 */
		this.handle = async (query) => {
			let nightmare = new Nightmare(opts.nightmareConfig);
			// Bind to default nightmare events for logging
			nightmare.on('will-navigate', (ev, url) => {
									opts.logger.log('info', `Navigating to ${url}`);
								})
							 .on('did-finish-load', () => {
								 opts.logger.log('info', `Finished loading page.`)
								})
							 .on('console', (type, message, ...args) => {
								 opts.logger.log('verbose', `<console.${type}> ${message}`,
								 ...args);
								})
							 .on('did-get-response-details',
										(ev, status, newUrl, originalUrl, responseCode,
										 method, referrer, headers, type) => {
								 opts.logger.log('debug',
																 `${method} ${responseCode} ` +
																 `${statusCode(responseCode)} ` +
																 `${originalUrl === newUrl
																		? newUrl
																		: `${originalUrl} -> ${newUrl}`}`
																);
							 });

			this.emit('begin', opts.id);
			opts.query = query;
			await nightmare.downloadManager();
			let r = await Promise.race([
				func(opts, nightmare),
				new Promise((resolve, reject) => {
					setTimeout(() => {
						nightmare.end().then(() => {
							resolve(1);
						});
					}, 25 * 60000)
				})
			]); // Invoke handler
			this.emit('complete', opts.id);
			return r;
		};

		/**
		 * Get the name of this handler.
		 * 
		 * @returns {String} The name bound in the handler options.
		 */
		this.name = () => {
			return opts.name;
		}
	}
}

module.exports = { Handler };
