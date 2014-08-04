var fs = require('fs');
var Gettext = require('node-gettext');
var glob = require("glob")
var path = require("path")

module.exports = function(app, options) {

    var options = options || {};
    var logger = options.logger || console;
    var gt = new Gettext();

    // Defaults
    options.defaultLanguage = options.defaultLanguage || 'en-US';
    options.currentLanguage = options.currentLanguage || 'en-US';
    options.alias = options.alias || 'gettext';

    // Load translations from PO files
    var dirPath = path.join(options.directory, "**/*.po");

    glob(dirPath, {}, function (err, files) {

        if(err) {
            logger.error('err', err);
        }

        files.forEach(function(file) {

            var fileContents = fs.readFileSync(file);
            var locale = file.match(/[a-z]{2}(-|_)[A-Z]{2}/)[0].replace('_','-').toLowerCase(); // Extract locale from path
            gt.addTextdomain(locale, fileContents);

        });

    });

    var getText = function(textKey, locale) {

        var currentLocale = (locale || options.currentLanguage).toLowerCase();
        var text = gt.gettext(textKey, currentLocale);

        logger.log('getText', text, currentLocale);

        if(!text) {
            // Fallback to default langauge
            logger.log('getText.fallback.default');
            text = gt.gettext(textKey, options.defaultLanguage);
        }

        if(!text) {
            logger.log('getText.fallback.missing');
            // Fallback to text key
            text = '[MISSING]' + textKey;
        }

        return text;

    }

    // Setup locals for Express
    app.locals[options.alias] = getText;
    app.locals.currentLanguage = options.currentLanguage;

    // Return middelware function to map locals on Request
    return function(req, res, next) {

        res.locals[options.alias] = getText;

        next();
    };

}
