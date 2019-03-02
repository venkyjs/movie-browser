/* eslint-disable no-undef */
const Axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const _ = require('lodash');

const { SECTIONS, RIP, LATEST } = require('./constants');
const { getUrl, fixUrl } = require('./utils');
const { read, save } = require('./db');

const IGNORE = 'TRProxy';
const DATE_STR = '- started  ';

let data;
const dataSet = {
	asArray: {},
	byYear: {},
	byMovie: {}
};

let domain;
let lastUpdated;

module.exports = {
	load: shouldScrap => {
		const settingsStr = read('data');
		let settings = {};
		if (settingsStr) {
			settings = JSON.parse(settingsStr);
			lastUpdated = settings.lastUpdated;
			domain = settings.domain;
		}
		const details = [];
		if (!data) {
			if (!data) {
				data = {};
			}
		}
		const promises = [];
		for (const eachSection of SECTIONS) {
			const name = eachSection.name;
			if (!dataSet.asArray[name]) dataSet.asArray[name] = [];
			if (!dataSet.byYear[name]) dataSet.byYear[name] = {};
			if (!dataSet.byMovie[name]) dataSet.byMovie[name] = {};
			const dataFromFile = read(name);
			if (!dataFromFile) {
				data[name] = {};
			} else {
				data[name] = JSON.parse(dataFromFile);
			}

			if (shouldScrap) {
				const url = getUrl(eachSection.id, domain);
				promises.push(beginLoading(url, name, false, details));
			}
		}

		if (shouldScrap) {
			Promise.all(promises).then(() => {
				console.log('completed execution');
			});

			settings.lastUpdated = lastUpdated = moment().format();
			save(JSON.stringify(settings), 'data');
		}
		return details;
	},
	getLastUpdated: () => lastUpdated,
	getData: (section, dataType) => {
		return _getData(section, dataType);
	},
	getRips: lang => {
		const rips = [];
		for (const eachSection of SECTIONS) {
			if (eachSection.language === lang && rips.indexOf(eachSection.rip) < 0) {
				rips.push(eachSection.rip);
			}
		}
		const processedRips = [];
		for (const eachRip of rips) {
			const ripInfo = RIP[eachRip.toUpperCase()];
			processedRips.push({ rip: eachRip, ...ripInfo });
		}
		return processedRips;
	},
	getMovies: (language, rip, top, showLatest) => {
		const section = _.find(SECTIONS, { language, rip });
		if (!section) {
			return [];
		}
		const movies = _getData(section.name);

		const movieNameSeq = [];
		const movieNames = {};
		for (const eachMovie of movies) {
			const movieName = _.trim(eachMovie.name);
			if (!movieNames[movieName]) {
				movieNameSeq.push(movieName);
				movieNames[movieName] = [eachMovie];
			} else {
				movieNames[movieName].push(eachMovie);
			}
		}

		const resp = [];
		let i = 0;
		for (const eachMovie of movieNameSeq) {
			if (showLatest) {
				let contains = false;
				for (const eachTag of LATEST) {
					if (eachMovie.indexOf(eachTag) >= 0) {
						contains = true;
						break;
					}
				}
				if (!contains) {
					continue;
				}
			}
			resp.push(movieNames[eachMovie]);
			i++;
			if (top !== undefined && top === i) {
				break;
			}
		}

		return resp;
	}
};

const _getData = (section, dataType) => {
	switch (dataType) {
		case 'movie':
			return dataSet.byMovie[section];
		case 'year':
			return dataSet.byYear[section];
	}
	return dataSet.asArray[section];
};

const isPinned = currentNode => {
	if (
		currentNode &&
		currentNode.parent &&
		currentNode.parent.parent &&
		currentNode.parent.parent.parent &&
		currentNode.parent.parent.parent.children &&
		currentNode.parent.parent.parent.children[1] &&
		currentNode.parent.parent.parent.children[1].children &&
		currentNode.parent.parent.parent.children[1].children[0] &&
		currentNode.parent.parent.parent.children[1].children[0].data === 'Pinned'
	) {
		return true;
	} else {
		return false;
	}
};

const beginLoading = (url, name, dataUpdated = false, details) => {
	// eslint-disable-next-line no-undef
	return new Promise(resolve => {
		loadSection(url, name, dataUpdated, details, success => {
			// call /getMostRecentMovie?section=name to get the last update from the section

			// calculate the number of movies to be sent since the last update

			// make Axios POST call to update the movies using /updateMovies?section=name
			resolve(success);
		});
	});
};

const loadSection = (url, name, dataUpdated = false, details, completionCallback) => {
	const msg = 'loading url: ' + url;
	console.log(msg);
	details.push(msg);
	let done = false;
	Axios.get(url)
		.then(response => {
			const $ = cheerio.load(response.data);
			const names = $('.col_f_content > h4 > a > span');
			const links = $('.col_f_content > h4 > a');
			for (let i = 0; i < names.length; i++) {
				const eachName = names[i];
				const linkText = eachName.children[0].data;
				if (linkText.indexOf(IGNORE) >= 0 || isPinned(eachName)) {
					continue;
				}

				let brkIdx = linkText.indexOf('[');
				// if (brkIdx > 0){
				const linkId = links[i].attribs.id;
				const title = links[i].attribs.title || '';

				if (linkId && !data[name][linkId]) {
					let ripInfo = '',
						movieName = linkText;
					if (brkIdx < 0) {
						const lastBracketIdx = linkText.indexOf(')');
						if (lastBracketIdx >= 0) {
							brkIdx = lastBracketIdx + 1;
						}
					}
					if (brkIdx >= 0) {
						movieName = brkIdx >= 0 ? linkText.substr(0, brkIdx) : linkText;
						ripInfo = brkIdx >= 0 ? linkText.substr(brkIdx + 1) : '';
						const endBrkIdx = ripInfo.indexOf(']');
						if (endBrkIdx > 0) {
							ripInfo = ripInfo.substr(0, endBrkIdx);
						}
					}

					let linkHref = links[i].attribs.href;
					const pgIdx = linkHref.indexOf('/page');
					if (pgIdx > 0) {
						linkHref = linkHref.substr(0, pgIdx);
					}
					const originalData = {
						linkText,
						linkId,
						title
					};
					let date, time;

					const idx = title.indexOf(DATE_STR);
					let dates = title;
					if (idx >= 0) {
						dates = title.substr(idx + DATE_STR.length);
					}

					dates = dates.toLowerCase();
					const dtFormat = 'DD MMM YYYY';
					const timeFormat = 'hh:mm a';
					if (dates.indexOf('yesterday') >= 0) {
						time = dates.substr(dates.indexOf(',') + 2);
						const yestMoment = moment()
							.subtract(1, 'days')
							.format(dtFormat);
						date = moment(yestMoment + ' ' + time, dtFormat + ' ' + timeFormat).format();
					} else if (dates.indexOf('today') >= 0) {
						time = dates.substr(dates.indexOf(',') + 2);
						const todMoment = moment().format(dtFormat);
						date = moment(todMoment + ' ' + time, dtFormat + ' ' + timeFormat).format();
					} else {
						const fullFormat = 'DD MMMM YYYY - hh:mm a';
						date = moment(dates, fullFormat).format();
					}

					dataUpdated = true;
					data[name][linkId] = {
						id: linkId,
						name: movieName,
						link: linkHref,
						ripInfo,
						date,
						originalData
					};
				} else if (linkId) {
					done = true;
					break;
				}
				// }
			}
			if (!done) {
				const nextLink = $('.next > a');
				if (nextLink.length > 0) {
					let nextLinkHref = nextLink[0].attribs.href;
					if (nextLinkHref) {
						const qIdx = nextLinkHref.indexOf('?');
						if (qIdx > 0) {
							nextLinkHref = nextLinkHref.substr(0, qIdx);
						}
					}
					loadSection(nextLinkHref, name, dataUpdated, details, completionCallback);
				} else {
					done = true;
				}
			}

			if (done) {
				let msg;
				if (dataUpdated) {
					const strData = JSON.stringify(data[name]);
					save(strData, name);
					msg = 'Completed. Data saved to file - ' + name;
				} else {
					msg = 'Data already up-to-date in file - ' + name;
				}
				console.log(msg);
				details.push(msg);
				createDataSets(name);
				completionCallback(true);
			}
		})
		.catch(err => {
			console.error(err);
			completionCallback(false);
		});
};

const createDataSets = name => {
	const rawData = data[name];
	const rawDataAsArr = Object.keys(rawData).map(item => rawData[item]);
	rawDataAsArr.sort((o1, o2) => {
		if (!o1.date) {
			return -1;
		} else if (!o2.date) {
			return 1;
		} else {
			const o1Date = moment(o1.date);
			const o2Date = moment(o2.date);
			if (o1Date < o2Date) {
				return 1;
			} else if (o1Date > o2Date) {
				return -1;
			} else {
				return 0;
			}
		}
	});
	for (const rawItem of rawDataAsArr) {
		const item = fixUrl(rawItem, domain);

		const movieName = _.trim(item.name);
		if (!dataSet.byMovie[name][movieName]) {
			dataSet.byMovie[name][movieName] = [item];
		} else {
			dataSet.byMovie[name][movieName].push(item);
		}
		if (movieName.indexOf('(') >= 0 && movieName.indexOf(')') > 0) {
			const lastOpenBrk = movieName.lastIndexOf('(') + 1;
			const lastCloseBrk = movieName.lastIndexOf(')');
			const year = _.trim(movieName.substring(lastOpenBrk, lastCloseBrk));
			if (!dataSet.byYear[name][year]) {
				dataSet.byYear[name][year] = [item];
			} else {
				dataSet.byYear[name][year].push(item);
			}
		}
		dataSet.asArray[name].push(item);
	}
};
