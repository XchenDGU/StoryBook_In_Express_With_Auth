const path = require('path');

const express = require('express');
const dotenv = require('dotenv');

const morgan = require('morgan');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const passport = require('passport')
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const flash = require('connect-flash');

//Load config (global variables)
dotenv.config({path:'./config/config.env'});

// Passport config
require('./config/passport')(passport);


//Connect the DB
connectDB();

const app = express();

// Body parser
app.use(express.urlencoded({extended:false}));//accept form data
app.use(express.json());



//Method override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  }))


if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// Handlebars Helpers
const {formatDate,stripTags,truncate,editIcon,select} = require('./helpers/hbs');

//Handlebars
app.engine(
    '.hbs',
    exphbs(
        {helpers:{
            formatDate,
            stripTags,
            truncate,
            editIcon,
            select,
        },
        defaultLayout:'main',
        extname:'.hbs',
        partialsDir:__dirname+'/views/partials',
    })
);
app.set('view engine','.hbs');

//Session
app.use(session({
    secret: 'keyboard cat',
    resave: false, //don't save if nothing is modified.
    saveUninitialized: false, //don't create a session until something is stored.
    store: new MongoStore({mongooseConnection:mongoose.connection}),
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session())

// Set global var
app.use(function(req,res,next){
    res.locals.user = req.user || null;
    next();
})

// Static folder
app.use(express.static(path.join(__dirname,'public',)))


// Routes
app.use('/',require('./routes/index'));
app.use('/auth',require('./routes/auth'));
app.use('/stories',require('./routes/stories'));
app.use('/signup',require('./routes/signup'));
app.use('/passwordrecover',require('./routes/passwordRecover'));
app.use('/*',require('./routes/default'));



const PORT = process.env.PORT || 3000;
app.listen(PORT,console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));