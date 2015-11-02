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
    options.detectors                   = options.detectors || {
        header: 'accept-language',
        query:  'locale'
    };
    options.fallback                    = options.fallback || defaultFallback;

    // Locales
    var localeDetector;
    var supportedLocales = [];

    // Load translations from PO files
    var dirPath = path.join(options.directory, "**/*.po");

    glob(dirPath, {}, function (err, files) {

        var locales = []

        if(err) {
            logger.error('err', err);
        }

        files.forEach(function(file) {

            var fileContents;
            var match = file.match(/[a-z]{2}(-|_)[A-Z]{2}/); // Extract locale from path
            var localeKey = match ? getLocaleKey(match[0]) : null;

            if(localeKey) {

                fileContents = fs.readFileSync(file);

                if(locales.indexOf(localeKey) == -1) {
                    locales.push(localeKey);
                }

                gt.addTextdomain(localeKey, fileContents);
            }

        });

        supportedLocales = new locale.Locales(locales);
        localeDetector = locale(supportedLocales);

    });

    function getSupportedLocales() {
        return Array.prototype.map.call(supportedLocales, function(locale) {
            return locale.normalized;
        });
    };

    // Setup app
    app.setLocale = setLocale;
    app.getLocale = getLocale;
    app.getDefaultLocale = getDefaultLocale;

    app.getSupportedLocales = getSupportedLocales;

    app[options.alias] = getText;

    app.set('gettext instance', gt);
    app.set('gettext fallback', options.fallback);
    app.setLocale(options.defaultLocale || 'en-US');

    // Setup locals for Express
    app.locals[options.alias] = getText.bind(app);
    app.locals.getLocale = getLocale.bind(app);
    app.locals.getSupportedLocales = getSupportedLocales;

    // Return middleware function to map locals on Response
    return function(req, res, next) {

        // Set response helpers
        res.setLocale = setLocale;
        res.getLocale = getLocale;
        res.getDefaultLocale = getDefaultLocale;
        res.getSupportedLocales = getSupportedLocales;
        res[options.alias] = getText;

        // Set locals helpers
        res.locals[options.alias] = getText.bind(res);
        res.locals.getLocale = getLocale.bind(res);

        // For backwards compatibility
        res.locals.getCurrentLocale = res.locals.getLocale;

        // Just to make sure it's accessible (some view engines don't inherit app's locals)
        res.locals.getSupportedLocales = getSupportedLocales;

        if(options.detectors.header) {
            var locales = new locale.Locales(req.headers[options.detectors.header])
            var matchedLocale = locales.best(supportedLocales);

            res.setLocale(matchedLocale.normalized);
        }

        if(options.detectors.query && req.query[options.detectors.query]) {
            var locales = new locale.Locales(req.query[options.detectors.query])
            var matchedLocale = locales.best(supportedLocales);

            res.setLocale(matchedLocale.normalized);
        }

        next();
    };

}

// Make locale RFC 5646 compliant
function normalizeLocale(locale) {
    // Dummy replace (doesn't ensure casing of country code)
    // Consider using locale's normalization logic
    return locale.replace('_', '-');
}

// Get key for given locale
function getLocaleKey(locale) {
    return locale.replace('-','_').toLowerCase();
}

function setLocale(locale) {
    if (!this.locals) this.locals = Object.create(null);
    this.locals.locale = normalizeLocale(locale);
}

function getLocale() {
    var locale = this.locals ? this.locals.locale : null;
    if (!locale && this.app) {
        locale = getDefaultLocale.call(this.app);
    }
    return locale;
}

function getDefaultLocale() {
    var app = getExpressApp(this);

    return app.locals ? app.locals.locale : null;
}

function getExpressApp(reqOrApp) {
    return isExpressApp(reqOrApp) ? reqOrApp : isExpressApp(reqOrApp.app) ? reqOrApp.app : null;
}

function isExpressApp(app) {
    return app && typeof app.handle == 'function';
}

function getText(textKey, locale) {

    var app = getExpressApp(this);
    var gt = app.set('gettext instance');
    var fallback = app.set('gettext fallback');

    var targetLocaleKey = getLocaleKey(locale || this.getLocale());
    var text = gt.dgettext(targetLocaleKey, textKey);

    if(!text) {
        // Fallback to default langauge
        targetLocaleKey = getLocaleKey(this.getDefaultLocale());
        text = gt.dgettext(targetLocaleKey, textKey);
    }

    if(!text) {
        text = fallback(textKey, locale);
    }

    return text;
};

function defaultFallback(textKey) {
    // Fallback to text key
    return '[MISSING]' + textKey;
}
