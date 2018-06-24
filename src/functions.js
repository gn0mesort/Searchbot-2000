'use strict';

const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const fs = require('fs-extra');

/**
 * Identify target elements in a page.
 *
 * @param {String} selector The selector to use to find elements.
 * @param {String} id The id to tag elements with.
 * @param {Nightmare} nightmare A nightmare instance that holds the target page.
 * @returns {Object} An object indicating the id, length of target elements,
 * and hash of the page body.
 */
async function identify(selector, id, nightmare) {
	let data = await nightmare.evaluate((selector, id) => {
		let elements = document.querySelectorAll(selector);
		for (let i = 0; i < elements.length; ++i) {
			elements[i].setAttribute(`data-${id}-${i}`, true);
		}
		return { length: elements.length, body: document.body.innerHTML };
	}, selector, id),
			sha256 = crypto.createHash('sha256');

	sha256.update(data.body);

	return { id: id, length: data.length, hash: sha256.digest('hex') };
}

/**
 * Convert a Number into an HTTP status code.
 * 
 * @param {Number} status The number of the status code to convert.
 * @returns {String} The text equivalent of the input status.
 */
function statusCode(status) {
	switch (status) {
		case 100: { return 'Continue'; }
		case 101: { return 'Switching Protocols'; }
		case 102: { return 'Processing'; }
		case 103: { return 'Early Hints'; }
		case 200: { return 'OK'; }
		case 201: { return 'Created'; }
		case 202: { return 'Accepted'; }
		case 203: { return 'Non-Authoritative Information'; }
		case 204: { return 'No Content'; }
		case 205: { return 'Reset Content'; }
		case 206: { return 'Partial Content'; }
		case 207: { return 'Multi-Status'; }
		case 208: { return 'Already Reported'; }
		case 226: { return 'IM Used'; }
		case 300: { return 'Multiple Choices'; }
		case 301: { return 'Moved Permanently'; }
		case 302: { return 'Found'; }
		case 303: { return 'See Other'; }
		case 304: { return 'Not Modified'; }
		case 305: { return 'Use Proxy'; }
		case 306: { return 'Switch Proxy'; }
		case 307: { return 'Temporary Redirect'; }
		case 308: { return 'Permanent Redirect'; }
		case 400: { return 'Bad Request'; }
		case 401: { return 'Unauthorized'; }
		case 402: { return 'Payment Required'; }
		case 403: { return 'Forbidden'; }
		case 404: { return 'Not Found'; }
		case 405: { return 'Method Not Allowed'; }
		case 406: { return 'Not Acceptable'; }
		case 407: { return 'Proxy Authentication Required'; }
		case 408: { return 'Request Timeout'; }
		case 409: { return 'Conflict'; }
		case 410: { return 'Gone'; }
		case 411: { return 'Length Required'; }
		case 412: { return 'Precondition Failed'; }
		case 413: { return 'Payload Too Large'; }
		case 414: { return 'URI Too Long'; }
		case 415: { return 'Unsupported Media Type'; }
		case 416: { return 'Range Not Statisfiable'; }
		case 417: { return 'Expectation Failed'; }
		case 418: { return 'I\'m a teapot'; }
		case 421: { return 'Misdirected Request'; }
		case 422: { return 'Unprocessable Entity'; }
		case 423: { return 'Locked'; }
		case 424: { return 'Failed Dependency'; }
		case 426: { return 'Upgrade Required'; }
		case 428: { return 'Precondition Required'; }
		case 429: { return 'Too Many Requests'; }
		case 431: { return 'Request Header Fields Too Large'; }
		case 451: { return 'Unavailable For Legal Reasons'; }
		case 500: { return 'Internal Server Error'; }
		case 501: { return 'Not Implemented'; }
		case 502: { return 'Bad Gateway'; }
		case 503: { return 'Service Unavailable'; }
		case 504: { return 'Gateway Timeout'; }
		case 505: { return 'HTTP Version Not Supported'; }
		case 506: { return 'Variant Also Negotiates'; }
		case 507: { return 'Insufficient Storage'; }
		case 508: { return 'Loop Detected'; }
		case 510: { return 'Not Extended'; }
		case 511: { return 'Network Authentication Required'; }
		default: { return 'Unknown Status Code'; }
	}
}

/**
 * Return a random number between min and max.
 * 
 * @param {Number} min The minimum bound (inclusive).
 * @param {Number} max The maximum bound (inclusive).
 * @returns {Number} The random result.
 */
function rand(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Wait until JavaScript has finished executing in a Nightmare page
 * 
 * @param {Object} opts An object containing program options
 * @param {Nightmare} nightmare A nightmare instance representing the current
 * browser state.
 */
async function jswait(opts, nightmare) {
		opts.logger.log('info', 'JS wait');
		await nightmare.wait(() => {
			return new Promise((resolve, reject) => {
																								console.log("Finished");
																								resolve(true);
																							});
		});
}

/**
 * Wait the specified number of seconds before continuing
 * 
 * @param {Number} seconds The number of seconds to wait.
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current
 * browser state.
 */
async function wait(seconds, opts, nightmare) {
	opts.logger.log('info', `Wait ${seconds}s`);
	await nightmare.wait(seconds * 1000);
}

/**
 * Click a selected element in a page.
 * 
 * @param {String} selector The selector for the element to click.
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current 
 * browser state.
 */
async function click(selector, opts, nightmare) {
	opts.logger.log('info', `Click ${selector}`);
	await nightmare.click(selector);
	++opts.clicks;
}

/**
 * Standard search function used by built-in handlers.
 * Searches for the current query (in opts) on the specified url.
 * 
 * @param {String} url The url of the search page in question.
 * @param {String} inputSelector A selector for the input box on the search 
 * page.
 * @param {String} buttonSelector A selector for the 'search' button on the 
 * page.
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current 
 * browser state.
 */
async function search(url, inputSelector, buttonSelector, opts, nightmare) {
	opts.logger.log('info', `Searching for ${opts.query}`);
	await nightmare.goto(url);
	await nightmare.type(inputSelector, opts.query);
	await waitJitter(opts, nightmare);
	await nightmare.click(buttonSelector);
	await jswait(opts, nightmare);
	opts.logger.log('debug', `URL is ${(await nightmare.url()).toString()}`);
}

/**
 * Standard paging function used by built-in handlers.
 * Jumps to the next page for the current query based on a selector.
 * 
 * @param {String} nextSelector The selector for the next button on the page.
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current
 * browser state.
 */
async function page(nextSelector, opts, nightmare) {
	for (let i = 0; i < opts.page; ++i) {
		opts.logger.log('info',`Page to ${i + 2}`);
		await nightmare.wait(nextSelector);
		await nightmare.click(nextSelector);
		await jswait(opts, nightmare);
	}
}

/**
 * Get data on page elements matching a selector.
 * 
 * @param {String} selector The selector for elements to identify/
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current 
 * browser state.
 * @returns {Object} An object containing data about identified elements.
 */
async function data(selector, opts, nightmare) {
	let r = null;

	opts.logger.log('debug', `DATA-REQUEST '${selector}'`);
	r = await identify(selector, opts.id, nightmare);
	opts.logger.log('debug', `DATA-RESPONSE ${JSON.stringify(r)}`);

	return r;
}

/**
 * Wait a random amount of time.
 * 
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current 
 * browser state.
 */
async function waitJitter(opts, nightmare) {
	await wait(rand(1, opts.jitter), opts, nightmare);
}

/**
 * Clean up <a target=""> attributes.
 * This is necessary for some engines that insist on opening links in new tabs.
 * 
 * @param {Object} opts An object containing program options.
 * @param {Nightmare} nightmare A nightmare instance representing the current 
 * browser state.
 */
async function scrubTargets(opts, nightmare) {
	opts.logger.log('debug', 'Scrubbing target attributes.');
	await nightmare.evaluate(() => {
		for (let anchor of document.querySelectorAll('a')) {
			anchor.removeAttribute('target');
		}
	});
}

module.exports = {
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
