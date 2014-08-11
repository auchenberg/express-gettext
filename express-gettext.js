var fs = require('fs');
var Gettext = require('node-gettext');
var glob = require("glob")
var path = require("path")
var locale = require("locale");

module.exports = function(app, options) {

    var options = options || {};
    var logger = options.logger || console;
    var gt = new Gettext();

    // Default options
    options.directory                   = options.directory || 'locales';
    options.alias                       = options.alias || 'gettext';
    options.useAcceptedLangugeHeader    = options.useAcceptedLangugeHeader || true;

    // Locales
    var localeDetector;
    var supportedLocales    = [];
    var defaultLocale       = options.defaultLocale || 'en-US';
    var currentLocale       = options.currentLocale || 'en-US';

    // Load translations from PO files
    var dirPath = path.join(options.directory, "**/*.po");

    glob(dirPath, {}, function (err, files) {

        var locales = []

        if(err) {
            logger.error('err', err);
        }

        files.forEach(function(file) {

            var fileContents = fs.readFileSync(file);
            var locale = file.match(/[a-z]{2}(-|_)[A-Z]{2}/)[0].replace('-','_').toLowerCase(); // Extract locale from path

            if(locale) {
                locales.push(locale);
                gt.addTextdomain(locale, fileContents);
            }

        });

        supportedLocales = new locale.Locales(locales);
        localeDetector = locale(supportedLocales);

    });

    var getText = function(textKey, locale) {

        var targetLocale = (locale || currentLocale).toLowerCase();
        var text = gt._getTranslation(targetLocale, textKey);

        if(!text) {
            // Fallback to default langauge
            var locale = defaultLocale.toLowerCase();
            text = gt._getTranslation(locale, textKey);
        }

        if(!text) {
            // Fallback to text key
            text = '[MISSING]' + textKey;
        }

        return text;

    }

    var setCurrentLocale = function(locale) {
        currentLocale = locale;
    };

    var getCurrentLocale = function() {
        return currentLocale;
    };

    var getFormattedLocale = function() {
        return getCurrentLocale().replace('_', '-');
    }

    // Setup locals for Express
    app.locals[options.alias] = getText;
    app.locals.getCurrentLocale = getFormattedLocale;
    app.locals.setCurrentLocale = setCurrentLocale;

    // Return middelware function to map locals on Request
    return function(req, res, next) {

        if(options.useAcceptedLangugeHeader) {
            var locales = new locale.Locales(req.headers["accept-language"])
            var matchedLocale = locales.best(supportedLocales);

            setCurrentLocale(matchedLocale.normalized);
        }

        res.locals[options.alias] = getText;
        req.setCurrentLocale = setCurrentLocale;
        req.getCurrentLocale = getFormattedLocale;

        next();
    };

}
