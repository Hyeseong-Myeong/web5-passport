const express = require('express')
const app = express()
var fs = require('fs');
var qs = require('querystring');
var bodyParser = require('body-parser');//built in body-parser since express v4.16
var compression = require('compression');

var helmet = require('helmet');
var session = require('express-session');
var FileStore = require('session-file-store')(session)
app.use(helmet());

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(compression());
app.use(session({
  //HttpOnly:true //can't use session with js
  secure: true,
  secret: 'asadlfkj!@#!@#dfgasdg',
  resave: false,
  saveUninitialized: true,
  store: new FileStore()
}))

var authData = {
  email:'test@test.com',
  password:'1111',
  nickname:'hyeseong'
}

var passport = require('passport')
 , LocalStrategy = require('passport-local').Strategy;

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  console.log('seriallizeUser', user);
  done(null, user.email);
  // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id);
  done(null, authData);
});

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'pwd'
  },
 function(username, password, done) {
   console.log('LocalStrategy', username, password);
   if(username === authData.email){
     if(password === authData.password){
      return done(null, authData);
     }else {
       return done(null, false, {
         message: 'Incorrect password.'
       })
     }
   }else {
     return done(null, false, {
       message: 'Incorrect username.'
     })
   }
 }
));

app.post('/auth/login_process', 
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login'
  })
);

app.get('*', function(request, response, next){
  fs.readdir(`./data`, function(error, filelist){
    request.list = filelist;
    next();
  });
});

var topicRouter = require('./routes/topic.js');
var indexRouter = require('./routes/index.js');
var authRouter = require('./routes/auth');
const auth = require('./lib/auth.js');

//route, routing
// app.get('/', (req, response) => response.send('Hello World!')) 
app.use('/', indexRouter);
app.use('/topic', topicRouter);
app.use('/auth', authRouter);

app.use(function(req, res, next){
  res.status(404).send('Sorry cant find that!')
});

app.use(function(err, req, res, next){
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

//app.listen(3000, () => console.log('Example app listening on port 3000!'))
app.listen(3000, function(){
  console.log('Example app listening on port 3000!')
});

/*
var http = require('http');
var url = require('url');


var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      } else {
        fs.readdir('./data', function(error, filelist){
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
              allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.HTML(sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
              ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = template.list(filelist);
        var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '');
        response.writeHead(200);
        response.end(html);
      });
    } else if(pathname === '/create_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var title = post.title;
          var description = post.description;
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
      });
    } else if(pathname === '/update'){
      fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    } else if(pathname === '/update_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var title = post.title;
          var description = post.description;
          fs.rename(`data/${id}`, `data/${title}`, function(error){
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){
              response.writeHead(302, {Location: `/?id=${title}`});
              response.end();
            })
          });
      });
    } else if(pathname === '/delete_process'){
      var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          var id = post.id;
          var filteredId = path.parse(id).base;
          fs.unlink(`data/${filteredId}`, function(error){
            response.writeHead(302, {Location: `/`});
            response.end();
          })
      });
    } else {
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);
*/
