const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
var bodyParser = require("body-parser");


const app = express();

//Settings

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname,'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname : '.hbs'
}));
app.set('view engine', '.hbs');


//Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use( bodyParser.json() );      
app.use(bodyParser.urlencoded({    
  extended: true
})); 


//Routes
app.use(require('./routes'));



//Static files
app.use(express.static(path.join(__dirname,'public')));


module.exports = app; 

