'use strict';

const path = require('path');

const { rand,
				data,
				waitJitter,
				jswait,
				wait,
				click,
				search,
				page,
				scrubTargets
			} = require(path.join(__dirname, '../../index.js'));

/**
 * Handler for aol.com searches
 * 
 * @param {Object} opts Handler configuration options
 * @param {Nightmare} nightmare The Nightmare instance for this handler
 * @returns {Number} 0 if it was successful otherwise a status code (probably 1)
 */
module.exports = async function(opts, nightmare) {

	try {
		// The selector for links on aol
		const selector = 'div.ads h3 a, div.algo a';

		opts.page = 0;
		opts.clicks = 0;
		await nightmare.useragent(opts.userAgent);

		do {
			// Search aol.com, input into the search box, click the search button
			await search('https://search.aol.com',
									 'input[name="q"]',
									 'form[name="s"] button[type="submit"]',
									 opts,
									 nightmare
									);
			// Page to the correct page
			await page('a.next', opts, nightmare);
			// Select elements from the results page
			let res = await data(selector, opts, nightmare);
			await waitJitter(opts, nightmare);
			// If there are links to click and we haven't clicked enough yet
			if (res.length > 0 && opts.clicks < opts.minClicks) {
				let target = `data-${opts.id}-${rand(0, res.length)}`;
				// Ensure links open in the same window
				await scrubTargets(opts, nightmare);
				// Click a link
				await click(`[${target}]`, opts, nightmare);
				opts.logger.log('info', `${opts.clicks} / ${opts.minClicks} clicks.`);
			}
			// Otherwise
			else {
				// Move on to the next page
				++opts.page
				opts.clicks = 0;
				opts.logger.log('debug', `Searches will start at ${opts.page}`);
			}
		} while (opts.page < opts.maxDepth);
		// Kill the nightmare instance
		await nightmare.end();
		return 0;
	}
	catch (err) {
		opts.logger.log('error', err);
		opts.logger.log('debug', err.stack);
		opts.logger.log('debug', JSON.stringify(err));
		await nightmare.end();
		return 1;
	}
};
