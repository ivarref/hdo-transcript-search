import express   from 'express';
import logger    from 'morgan';
import hbs       from 'express-hbs';
import api       from './search-api';
import config    from '../../config';
import examples  from '../../config/examples';
import path      from 'path';
import analytics from './analytics';
import fs        from 'fs';

let app = express();

// config
app.use(logger('short'));
app.set('port', +config.get('PORT'));
app.disable('x-powered-by');
app.engine('hbs', hbs.express4());
app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, '../../views'));
app.set('analytics', app.get('env') === 'production');

app.locals.appTitle       = 'Sagt i salen';
app.locals.appDescription = 'En visualisering av språkbruk på Stortinget fra Holder de ord';
app.locals.facebookAppId  = 504447209668308;

if(app.get('env') === 'development') {
    app.use(require('errorhandler')());

    var webpack           = require('webpack');
    var webpackMiddleware = require('webpack-dev-middleware');
    var webpackConf       = require('../../webpack.config');

    app.use(webpackMiddleware(webpack(webpackConf)));

    app.get('/bundle.:ext', (req, res) => {
        fs.readFile('./public/hash', 'utf-8', (err, hash) => {
            res.redirect(`/bundle.${hash}.${req.params.ext}`);
        });
    });

    app.locals.bundleName = 'bundle';
} else {
    fs.readFile('./public/hash', 'utf-8', (err, hash) => {
        if (err) {
            throw err;
        }

        app.locals.bundleName = `bundle.${hash}`;
    });
}

app.use(express.static(path.resolve(__dirname, '../../public')));

app.use((req, res, next) => {
    res.locals.baseUrl = `${req.protocol}://${req.get('host')}`;
    res.locals.absoluteUrl = res.locals.baseUrl + req.originalUrl;

    if (req.path.indexOf('analytics') !== -1) {
        res.setHeader('Cache-Control', 'public, max-age=5');
    } else if (req.path.indexOf('/api') === 0) {
        res.setHeader('Cache-Control', 'public, max-age=600');
    } else {
        res.setHeader('Cache-Control', 'public, max-age=5');
    }

    return next();
});

app.get('/', (req, res) => {
    let example = examples[Math.floor(Math.random() * examples.length)];
    let query   = encodeURIComponent(example.join('.'));

    res.redirect(`/search/pct/${query}/0`);
});

app.get('/speeches/:transcript/:order', (req, res) => {
    res.render('index', {
        title: `Innlegg ${req.params.transcript} / ${req.params.order}`
    });
});

app.get('/search', (req, res) => {
    res.render('index', {
        title: 'Stortingssøk',
    });
});

app.get('/search/:unit/:query/:focused', (req, res) => {
    res.render('index', {
        title: req.params.query.split('.').join(', '),
    });
});

app.get('/opensearch', (req, res) => {
    res.type('application/opensearchdescription+xml');
    res.render('opensearch');
});

app.get('/api/search/summary', (req, res) => {
    if (validQuery(req.query.query)) {
        api.summary(req.query)
            .then(results => res.json(results))
            .catch(errorHandler.bind(res));
    } else {
        res.status(400).json({error: {message: "missing query param"}});
    }
});

app.get('/api/search/hits', (req, res) => {
    if (validQuery(req.query.query)) {
        api.hits(req.query)
            .then(results => res.json(results))
            .catch(errorHandler.bind(res));
    } else {
        res.status(400).json({error: {message: "missing or invalid query param"}});
    }
});

app.get('/api/export', (req, res) => {
    if (validQuery(req.query.query)) {
        let format = req.query.format || 'tsv';

        res.type(format);
        api.getHitStream(req.query).pipe(res);
    } else {
        res.status(400).json({error: {message: "missing or invalid query param"}});
    }
});

app.get('/api/speeches/:id', (req, res) => {
    api.getSpeech(req.params.id)
        .then(results => res.json(results))
        .catch(errorHandler.bind(res));
});

app.get('/api/context/:transcript/:start/:end', (req, res) => {
    var {transcript,start,end} = req.params;

    api.getContext(transcript, +start, +end)
        .then(d => res.json(d))
        .catch(errorHandler.bind(res));
});

app.get('/api/analytics/top-searches/:days?', (req, res) => {
    var params = {
        days: req.params.days || 30,
        limit: (req.query.limit || 200),
        examples: req.query.examples !== 'false'
    };

    analytics
        .topSearches(params)
        .then((d) => res.json(d) )
        .catch(errorHandler.bind(res));
});

app.get('/api/analytics/image-errors', (req, res) => {
    analytics
        .imageErrors()
        .then((d) => res.json(d) )
        .catch(errorHandler.bind(res));
});

app.get('/api/analytics/sources/:days?', (req, res) => {
    analytics
        .sources({days: req.params.days || 30})
        .then((d) => res.json(d) )
        .catch(errorHandler.bind(res));
});

app.get('/api/analytics/active', (req, res) => {
    analytics
        .active()
        .then((d) => res.json(d) )
        .catch(errorHandler.bind(res));
});

app.get('/api/analytics/browsers/:days?', (req, res) => {
    analytics
        .browsers({days: req.params.days || 30})
        .then((d) => res.json(d) )
        .catch(errorHandler.bind(res));
});

module.exports = app;

function errorHandler(err) {
    console.error(err);

    return this.status(500).json({
        error: {
            message: err.toString(),
            stack: err.stack.split('\n')
        }
    });
}

function validQuery(qs) {
    return qs && qs.length && qs.trim() !== '*';
}