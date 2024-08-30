const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
const connectDB = require('./config/mongoose.js')
const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const session = require('express-session')
dotenv.config();
connectDB()

app.use(helmet({
  contentSecurityPolicy:false,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  expectCt: { maxAge: 86400 },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { policy: "none" },
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true
}));

const disallowedUserAgents = [
  /curl/i, /wget/i, /python/i, /libwww-perl/i, /java/i, /httpclient/i,
  /php/i, /mechanize/i, /scrapy/i, /go-http-client/i, /PostmanRuntime/i,
  /HttpRequest/i, /python-requests/i, /lwp-request/i, /okhttp/i,
  /urllib/i, /PycURL/i, /RestSharp/i, /GuzzleHttp/i, /node-fetch/i,
  /Puppeteer/i, /PhantomJS/i, /selenium/i, /casperjs/i, /http-kit/i,
  /jsdom/i, /zabbix/i, /Apache-HttpClient/i, /perl/i, /Faraday/i,
  /rest-client/i, /fetch/i, /httpie/i, /lwp/i, /msie 6/i, /netscape/i,
  /mozilla\/4\.0/i, /zgrab/i
];

const blockedIPs = new Set(); 

app.use((req, res, next) => {
  const userIp = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  
  if (req.path === '/') {
    blockedIPs.add(userIp);
    console.log(`IP blocked due to '/' suspicious activity. ${userIp}`);
    return res.status(403).send('Access blocked.');
  }

  if (blockedIPs.has(userIp)) {
    return res.status(403).send('Access blocked.');
  }

  for (const pattern of disallowedUserAgents) {
    if (pattern.test(userAgent)) {
      console.log(`Request was blocked due to suspicious activity. ${userAgent}`);
      if (userIp) {
        blockedIPs.add(userIp); 
        console.log(`Blocked IP added: ${userIp}`);
      }
      return res.status(403).send('Request was blocked due to suspicious activity.');
    }
  }

  console.log(req.path);
  
  if (req.path.startsWith('/admin')) {
    return next();
  }
  
  next();
});

app.set('trust proxy', 1);

const allowedOrigins = ["http://localhost:5173","https://wallet-checker-client.vercel.app","https://www.victarex.com"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};
require('./cron_jobs.js')

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(session({
  secret: process.env.JWT_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.use('/admin',adminRoute)

app.use('/', limiter);
app.use('/',userRoute)

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    res.status(403).send('CORS policy does not allow access from this origin');
  } else {
    res.status(500).send('Something broke!');
  }
});

app.listen(process.env.PORT, () => {
    console.log(`Example app listening at http://localhost:${process.env.PORT}`);
})