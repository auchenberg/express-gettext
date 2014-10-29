express-gettext
===============

Translation middleware for express.js using Gettext and PO files. 

I couldn't find any existing middleware that used PO files as the translation source (without converting them to JSON first), so there is a simple middleware that loads PO files, and exposes a simple gettext translate method on the ``response`` and ``app`` object to allow translations to be looked up from the server and in views.

### Properties
The middleware exposes some methods on the ``app`` object. They use on the application's "default" locale:
```
app.setLocale -> Method to set the default locale
app.getLocale || app.locals.getLocale || app.getDefaultLocale -> Methods to get the default locale
app[alias] || app.locals[alias] -> translate method (using the default locale)
```

Properties on the ```res`` object:
```
res.setLocale -> Method to set the current locale 
res.getLocale || res.locals.getLocale -> Method to get the current locale
res.getDefaultLocale -> Method to get the default (application) locale
res[alias] || res.locals[alias] -> translate method
```
### Options
```
{
    directory: -> The directory of PO files
    useAcceptedLanguageHeader: true
    alias -> The alias of the translate method (default 'gettext')
}
```

### Locale detection
The middleware also has crude locale detection based upon the acceptedLanguageHeader, which can be toggled with the ```useAcceptedLanguageHeader``` option.

### Example:

```javascript
var express = require('express');
var gettext = require('../express-gettext')

var app = express();

// Configuration
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Gettext configuration
app.use(gettext(app, {
    directory: __dirname + '/locales',
    useAcceptedLanguageHeader: true
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {

    if(req.query && req.query.locale) {
        req.setCurrentLocale(req.query.locale);
    }

    res.render('index');
});

app.listen(app.get('port'), function() {
    console.log("App listening on port " + app.get('port'));
});
```
