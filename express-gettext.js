var fs = require('fs');
var Gettext = require('node-gettext');
var glob = require("glob")
var path = require("path")

module.exports = function(app, options) {

    var options = options || {};
    var logger = options.logger || console;
    var gt = new Gettext();

    // Defaults
    options.defaultLocale   = (options.defaultLocale || 'en-US').toLowerCase();
    options.currentLocale   = (options.currentLocale || 'en-US').toLowerCase();
    options.directory       = (options.directory || 'locales');
    options.alias           = options.alias || 'gettext';

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

        var currentLocale = (locale || options.currentLocale).toLowerCase();
        var text = gt._getTranslation(currentLocale, textKey);

        if(!text) {
            // Fallback to default langauge
            text = gt._getTranslation(options.defaultLocale, textKey);
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
    app.locals.currentLocale = options.currentLocale;

    // Return middelware function to map locals on Request
    return function(req, res, next) {

        res.locals[options.alias] = getText;

        next();
    };

}
