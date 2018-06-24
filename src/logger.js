'use strict';

const EventEmitter = require('events');

const chalk = require('chalk');

/**
 * LogLevel enum type. Maps Numbers to LogLevel objects.
 */
class LogLevel {
	/**
	 * Creates a new LogLevel object that maps to the input value.
	 * Inputs may be Numbers or Strings.
	 * Numerical inputs must be between 0 and 5.
	 * String inputs must be one of error, warn, info, verbose, debug, or silly.
	 * 
	 * @param {Number|String} value The value of the created LogLevel
	 */
	constructor(value) {
		function checkValue(value) {
				if (value > 5 || value < 0 || !Number.isInteger(value)) { return 2; }
				else { return value; }
		}

		function fromString(value) {
			switch (value) {
				case 'error': { return 0; }
				case 'warn': { return 1; }
				case 'info': { return 2; }
				case 'verbose': { return 3; }
				case 'debug': { return 4; }
				case 'silly': { return 5; }
				default: { return 2; }
			}
		}

		if (typeof(value) === 'number') { this.value = checkValue(value); }
		else if (typeof(value) === 'string') { this.value = fromString(value); }
		else { throw new Error('LogLevel must be a String or Number.'); }
	}

	/**
	 * Gets the String representation of this LogLevel.
	 * 
	 * @returns One of error, warn, info, verbose, debug or silly.
	 */
	toString() {
		switch (this.value) {
			case 0: { return 'error'; }
			case 1: { return 'warn'; }
			case 2: { return 'info'; }
			case 3: { return 'verbose'; }
			case 4: { return 'debug'; }
			case 5: { return 'silly'; }
			default: { return 'info' }
		}
	}
}

/**
 * Defines a Logger object.
 * Loggers are event emitters that emit 'message' events when their log method
 * is called. Loggers don't actually define how data should be logged.
 */
class Logger extends EventEmitter {

	/**
	 * Creates a new Logger with the given label.
	 * 
	 * @param {String} label The label of this Logger.
	 * @param {Object} opts Any other values that should be bound to the created
	 * Logger object.
	 */
	constructor(label, opts) {
		super();
		this.label = label;
		Object.assign(this, opts);
	}

	/**
	 * Log a message and trigger any bound message handlers.
	 * 
	 * @param {LogLevel} level The LogLevel of this message
	 * @param {String} message The message to log.
	 */
	log(level, message) {
		this.emit('message', {
			timestamp: new Date().toISOString(),
			label: this.label,
			level: new LogLevel(level).toString(),
			message: message
		});
	}

	/**
	 * Static utility method to colorize log output.
	 * 
	 * @param {LogLevel} level The LogLevel to colorize for.
	 * @param {String} str The message to colorize.
	 * @returns {String} The colorized String.
	 */
	static colorize(level, str) {
		switch (level) {
			case 'error': { return chalk.red(str); }
			case 'warn': { return chalk.yellow(str); }
			case 'info': { return str; }
			case 'verbose': { return chalk.purple(str); }
			case 'debug': { return chalk.blue(str); }
			case 'silly': { return chalk.orange(str); }
		}
	}
}

module.exports = { Logger, LogLevel }
