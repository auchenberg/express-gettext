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
        res.setLocale(req.query.locale);
    }

    res.render('index');
});

app.listen(app.get('port'), function() {
    console.log("App listening on port " + app.get('port'));
});