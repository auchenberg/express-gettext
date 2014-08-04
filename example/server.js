var express = require('express');
var gettext = require('../express-gettext')

var app = express();

// Configuration
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Gettext configuration
app.use(gettext(app, {
    defaultLocale: 'de-de',
    directory: __dirname + '/locales'
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index');
});

app.listen(app.get('port'), function() {
    console.log("App istening on port " + app.get('port'));
});