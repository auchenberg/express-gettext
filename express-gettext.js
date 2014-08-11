var fs = require('fs');
var Gettext = require('node-gettext');
var glob = require("glob")
var path = require("path")

module.exports = function(app, options) {

    var options = options || {};
    var logger = options.logger || console;
    var gt = new Gettext();

    // Defaults
    options.defaultLocale               = options.defaultLocale || 'en-US';
    options.currentLocale               = options.currentLocale || 'en-US';
    options.directory                   = options.directory || 'locales';
    options.alias                       = options.alias || 'gettext';
    options.useAcceptedLangugeHeader    = options.useAcceptedLangugeHeader || true;

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

        var currentLocale = locale || options.currentLocale;
        var text = gt._getTranslation(currentLocale.toLowerCase(), textKey);

        if(!text) {
            // Fallback to default langauge
            text = gt._getTranslation(options.defaultLocale.toLowerCase(), textKey);
        }

        if(!text) {
            // Fallback to text key
            text = '[MISSING]' + textKey;
        }

        return text;

    }

    var setCurrentLocale = function(language) {
        options.currentLocale = language;
    }

    // Setup locals for Express
    app.locals[options.alias] = getText;
    app.locals.currentLocale = options.currentLocale;
    app.locals.setCurrentLocale = setCurrentLocale;

    // Return middelware function to map locals on Request
    return function(req, res, next) {

        res.locals[options.alias] = getText;
        req.setCurrentLocale = setCurrentLocale;

        if(options.useAcceptedLangugeHeader) {

            // Use first match from accepted languages header
            if(req.acceptedLanguages.length) {
                req.setCurrentLocale(req.acceptedLanguages[0]);
            }

        }

        next();
    };

}
