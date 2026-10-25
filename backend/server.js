require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require('morgan');
const app = express();
const helmet = require("helmet");
const http = require('http');

// const apiversion = '/api/' + process.env.API_VERSION;

const whitelist = process.env.API_WHITELIST?.split(',')

let corsOptions = {
    origin: function (origin, callback) {
        callback(null, true)
    },
    credentials: true
};

if (process.env.API_MODE == "prod") {
    corsOptions = {
        origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1 | 1) {
                callback(null, true)
                console.log("CORS OK FROM: ", origin);
            } else {
                callback(new Error("Not allowed by CORS from " + origin))
            }
        },
        credentials: true,
    }
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.xssFilter());
app.use(
    helmet.frameguard({
        action: "sameorigin",
    })
);

app.use(logger('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());

//Rutas
const auth = require('./src/routes/auth.js');
const reservations = require('./src/routes/reservations.js');
const aircrafts = require('./src/routes/aircrafts.js');
const experiences = require('./src/routes/experiences.js');
const services = require('./src/routes/services.js');
const gallery = require('./src/routes/gallery.js');
const reviews = require('./src/routes/reviews.js');
const instagram = require('./src/routes/instagram.js');
const publicCms = require('./src/routes/publicCms.js');
const toursGallery = require('./src/routes/toursGallery.js');
const addons = require('./src/routes/addons.js');
const pilots = require('./src/routes/pilots.js');
app.use('/auth', auth);
app.use('/reservations', reservations);
app.use('/aircrafts', aircrafts);
app.use('/experiences', experiences);
app.use('/services', services);
app.use('/gallery', gallery);
app.use('/reviews', reviews);
app.use('/instagram', instagram);
app.use('/public', publicCms);
app.use('/toursGallery', toursGallery);
app.use('/addons', addons);
app.use('/pilots', pilots);

// Para cualquier otra ruta, devuelvo 404
app.use((req, res) => {
    res.status(404).end();
});

const port = process.env.API_PORT;
app.set('port', port);

const server = http.createServer(app);

server.listen(port)
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    
    const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
    
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
                default:
                    throw error;
                }
            }
            
            
            function onListening() {
                const addr = server.address();
                const bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr.port;
                
                console.log('Fleetrust API running in ' + bind + '...')
            }