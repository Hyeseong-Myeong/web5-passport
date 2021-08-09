var express = require('express')
var router = express.Router()
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var template = require('../lib/template.js');
var fs = require('fs');


module.exports = function(passport){
  router.get('/login', function(request, response){
    var fmsg = request.flash();
    var feedback = '';
    if(fmsg.error){
      feedback = fmsg.error[0];
    }
    var title = 'WEB - login';
    var list = template.list(request.list);
    var html = template.HTML(title, list, `
      <div style="color:red;">${feedback}</div>
      <form action="/auth/login_process" method="post">
        <p><input type="text" name="email" placeholder="email"></p>
        <p>
        <input type="password" name="pwd" placeholder="password">
        </p>
        <p>
          <input type="submit" value="login">
        </p>
      </form>
    `, '');
    response.send(html);
  });
  /*
  router.post('/login_process', function(request, response){
    var post = request.body;
    var email = post.email;
    var password = post.pwd;
    if(email === authData.email && password === authData.password){
      //success!
      request.session.is_logined = true;
      request.session.nickname = authData.nickname;
      
      //바로 리다이렉트를 시키니까 아무리 해도 로그인 불가. 리다이렉트 대신 send()를 사용하니 로그인 성공.
      //바로 리다이렉트를 시킬 경우, 세션 데이터를 저장하기도 전에 리다이렉트를 시켜버려서 로그인 불가능.
      
      request.session.save(function(){
        response.redirect(`/`);
      })
    }else{
      response.send('Who?');
    }
  });
  */
  
  /*login session save - not working
  app.post('/auth/login_process', 
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/auth/login',
      failureFlash:true
    })
  );*/
  router.post('/login_process',
    passport.authenticate('local', {
      failureRedirect: '/auth/login',
      failureFlash: true 
    }),
    function(req, res){
      req.session.save(function(){
        res.redirect('/');
      })
    }
  );
  
  router.get('/logout', function(request, response){
    request.logout(); 
    request.session.destroy(function(err){
      response.redirect('/');
    });
  });
  return router;
}

