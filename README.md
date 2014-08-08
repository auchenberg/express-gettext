express-gettext
===============

Translation middelware for express.js using Gettext and PO files. 

I coulnd't find any existing middelware that used PO files as the translation source (without convertig them to JSON first), so there is a simple middelware that loads PO files, and exposes a simple getttext translate method on the ``request`` and ``app`` object to allow translations to be looked up from the server and in views.

### Properties
The middelware exposes two properties on the ``app`` object:
```
app.setCurrentLocale -> Method to set the current locale 
app.currentLocale -> Getter to get the current locale
req[alias] -> translate method
```

Properties on the ```req`` object:
```
req.setCurrentLocale -> Method to set the current locale 
req.currentLocale -> Getter to get the current locale
req[alias] -> translate method
```
### Options
```
{
    directory: -> The directory of PO files
    useAcceptedLangugeHeader: true
    alias -> The alias of the translate method (default 'gettext')
}
```

### Locale detection
The middelware also has cruide locale detection based upon the acceptedLangaugeHeader, which can be toggled with the ```useAcceptedLanguageHeader``` option.

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
    useAcceptedLangugeHeader: true
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {

    if(req.query && req.query.locale) {
        req.setCurrentLocale(req.query.locale);
    }

    res.render('index');
});

app.listen(app.get('port'), function() {
    console.log("App istening on port " + app.get('port'));
});
```
