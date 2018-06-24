'use strict';

const path = require('path');

const { rand,
				data,
				waitJitter,
				jswait,
				wait,
				click,
				search,
				page
			} = require(path.join(__dirname, '../../index.js'));

/**
 * Handler for bing.com searches
 * 
 * @param {Object} opts Handler configuration options
 * @param {Nightmare} nightmare The Nightmare instance for this handler
 * @returns {Number} 0 if it was successful otherwise a status code (probably 1)
 */
module.exports = async function(opts, nightmare) {

	try {
		// The selector for links on bing
		const selector = 'li div.sb_add a, li.b_algo h2 a';

		opts.page = 0;
		opts.clicks = 0;
		await nightmare.useragent(opts.userAgent);

		do {
			// Search bing.com, input into the search box, click the search button
			await search('https://www.bing.com',
									 'input[name="q"]',
									 'input[name="go"]',
									 opts,
									 nightmare
									);
			// Page to the correct page
			await page(opts, nightmare);
			// Select elements from the results page
			let res = await data(selector, opts, nightmare);
			await waitJitter(opts, nightmare);
			// If there are links to click and we haven't clicked enough yet
			if (res.length > 0 && opts.clicks < opts.minClicks) {
				// Click a link
				await click(`[data-${opts.id}-${rand(0, res.length)}]`,
										opts,
										nightmare
									);
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
