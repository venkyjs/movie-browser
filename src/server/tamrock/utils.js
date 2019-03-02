const { URL } = require('./constants')

module.exports = {
	getUrl: (section, domain) => {
		domain = domain ? domain : URL.DOMAIN
		return domain + URL.MAIN + section
	},
	fixUrl: (item, domain) => {
		domain = domain ? domain : URL.DOMAIN
		const { link } = item
		let noProt = link.substr(link.indexOf('//') + 2)
		noProt = noProt.substr(noProt.indexOf('/'))
		item.link = domain + noProt
		return item
	},
}
