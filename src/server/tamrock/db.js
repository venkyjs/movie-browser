const fs = require('fs');

const DIR = __dirname + '/database/';
const EXTN = '.json';
module.exports = {
    save: (data, collection) => {
        fs.writeFileSync(DIR + collection + EXTN, data);
    },
    read: (collection) => {
        const fullPath = DIR + collection + EXTN;
        if (fs.existsSync(fullPath)){
            return fs.readFileSync(fullPath, 'utf-8')
        } else {
            return undefined;
        }
    }
}