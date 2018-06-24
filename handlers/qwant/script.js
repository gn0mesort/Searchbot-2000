'use strict';

const path = require('path');

const { rand,
				data,
				waitJitter,
				jswait,
				wait,
				click,
				search,
				scrubTargets
			} = require(path.join(__dirname, '../../index.js'));

/**
 * Handler for qwant.com searches
 * 
 * @param {Object} opts Handler configuration options
 * @param {Nightmare} nightmare The Nightmare instance for this handler
 * @returns {Number} 0 if it was successful otherwise a status code (probably 1)
 */
module.exports = async function(opts, nightmare) {

	// Custom qwant paging function
	async function page(opts, nightmare) {
		let cur = 0,
				prev = -1,
				getHeight = () => { return document.body.scrollHeight; };

		while (cur !== prev) {
			prev = cur;
			cur = await nightmare.evaluate(getHeight); 
			await nightmare.scrollTo(cur, 0);
			opts.logger.log('info', `Scrolling to (${cur}, 0).`);
			await wait(5, opts, nightmare);
		}
		opts.logger.log('info', `Scrolling complete.`);
	}

	try {
		// The selector for links on qwant
		const selector = 'div.results-view--all a';

		opts.clicks = 0;
		await nightmare.useragent(opts.userAgent);

		do {
			// Search qwant.com, input into the search box, click the search button
			await search('https://www.qwant.com',
									 'input[name="q"]',
									 'span > span.icon-search',
									 opts,
									 nightmare
									);
//			await page(opts, nightmare);
			await scrubTargets(opts, nightmare);
			// Select elements from the results page
			let res = await data(selector, opts, nightmare);
			await waitJitter(opts, nightmare);
			// If there are links to click
			if (res.length > 0) {
				// Click a link
				await click(`[data-${opts.id}-${rand(0, res.length)}]`,
										opts,
										nightmare
									);
				opts.logger.log('info', `${opts.clicks} / ${opts.minClicks} clicks.`);
			}
		} while (opts.clicks < opts.minClicks);
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
