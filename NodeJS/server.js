const express = require('express');
const app = new express();
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const port = process.env.PORT || 8080;
var host1 = 'localhost';
var user1 = 'root';
var pwd1= 'gdrs9701';
var port1 = 3306;

app.use(express.static(path.join(__dirname,'public')));
app.set('views', './views');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
const con = mysql.createConnection({
  host: host1,
  user: user1,
  password: pwd1,
  port: port1,
  database: 'railwaydb'
});
var del = con._protocol._delegateError;
con._protocol._delegateError = function(err, sequence){
  if (err.fatal) {
    console.trace('fatal error: ' + err.message);
  }
  return del.call(this, err, sequence);
};

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,'index.html'))
});

app.get('/signup',function(req,res){
    res.sendFile(path.join(__dirname,'signup.html'))
});

app.get('/login',function(req,res){
  res.sendFile(path.join(__dirname,'Login.html'))
});

var adminName = 'admin';
var adminPwd = 'password';

app.get('/admin', function (req, res) {
    res.sendFile(path.join(__dirname, 'admin_login.html'));
});

app.post('/admin_action', function (req, res) {
    var username1 = req.body.uid;
    var password1 = req.body.pwd;
    if (username1 == adminName && password1 == adminPwd) {
        req.session.loggedin = true;
        res.sendFile(path.join(__dirname, 'adminactions.html'));
    } else {
        res.sendFile(path.join(__dirname, 'Login_error.html'));
    }
});

app.get('/train', function (req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'train.html'));
    } else {
        res.redirect('/admin');
    }
});

app.post('/addtrain', function (req, res) {
    if (req.session.loggedin) {
        con.connect(function (err) {
            var sql =
                "insert into TRAIN(TRAIN_NO,EXPRESS_NAME,FC_SEATS,SC_SEATS,FC_PRICE,SC_PRICE) values ('" +
                req.body.trainno +
                "','" +
                req.body.expressno +
                "','" +
                req.body.fcseats +
                "','" +
                req.body.scseats +
                "','" +
                req.body.fcprice +
                "','" +
                req.body.scprice +
                "')";
            con.query(sql, function (err, result) {
                if (err) {
                    console.error('Error inserting!\n');
                    throw err;
                    res.end();
                } else {
                    res.sendFile(path.join(__dirname, 'train_success.html'));
                }
            });
        });
    } else {
        res.redirect('/admin');
    }
});

app.get('/express', function (req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'express.html'));
    } else {
        res.redirect('/admin');
    }
});

app.post('/addexpress', function (req, res) {
    if (req.session.loggedin) {
        con.connect(function (err) {
            var sql =
                "insert into EXPRESS(TRAIN_NO,FROMM,TOO,STARTING_TIME,ARRIVAL_TIME,FC_SEATS_REMAINING,SC_SEATS_REMAINING) SELECT '" +
                req.body.trainno +
                "','" +
                req.body.from +
                "','" +
                req.body.to +
                "','" +
                req.body.startingtime +
                "','" +
                req.body.arrivaltime +
                "'," +
                'FC_SEATS,SC_SEATS FROM TRAIN WHERE TRAIN_NO=' +
                "'" +
                req.body.trainno +
                "'";
            con.query(sql, function (err, result) {
                if (err) {
                    console.error('Error inserting!\n');
                    throw err;
                    res.end();
                } else {
                    res.sendFile(path.join(__dirname, 'express_success.html'));
                }
            });
        });
    } else {
        res.redirect('/admin');
    }
});

app.get('/adminactions', function (req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'adminactions.html'));
    } else {
        res.redirect('/admin');
    }
});

app.post('/insert',function(req,res){
  con.connect(function(err){
    var sql = "insert into user_details(user_id,username,email_id,password) values ('"+req.body.uid+"','"
    +req.body.uname+"','"+req.body.emailid+"','"+req.body.pwd+"')";
    con.query(sql,function(err,result){
      if(err){
        if(err.errno==1062){ 
          res.sendFile(path.join(__dirname,'errorins.html'));
        }
        else
          {
            console.error("Error inserting!\n");
            throw err;
            res.end();
          }
      }
      else
      {
        res.sendFile(path.join(__dirname,'regsuccess.html'));
      }
     
    });
   
   });
   
});

app.post('/auth', function(request, response) {
	var username = request.body.uid;
	var password = request.body.pwd;
	con.query('SELECT * FROM user_details WHERE user_id = ? AND password = ?', [username, password], 
  function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
        
			} else {
        response.sendFile(path.join(__dirname,'Login_error.html'));
			}
		//	response.end();
		});
});

app.get('/home',function(request,response){
  if (request.session.loggedin) {
    response.sendFile(path.join(__dirname,'Login_success.html'));
    	} else {
    response.redirect('/login');
	}
	//response.end();
});

app.get('/booking',function(request,response){
	if (request.session.loggedin) {
  	response.sendFile(path.join(__dirname,'booking.html'));
	} else {
		response.redirect('/login');
	}
});


app.get('/prev',function(request,response){
	if(request.session.loggedin) {
		var quer = "select booking.* from booking,express where booking.express_no=express.express_no and "+
    "user_id = "+"'"+request.session.username+"'"+
    " and current_timestamp() > express.starting_time";
		con.query(quer,function(error,results,fields) {
      if(error) throw error;
      if(results.length <= 0)
        response.sendfile(path.join(__dirname,'no_previous.html'));
      else
        response.render('viewpast.ejs',{ result: results});
    })
	} else {
		response.redirect('/login');
	}
});

app.get('/existing', function (request, response) {
  if (request.session.loggedin) {
      var quer =
          'select PRESENTVIEW.BOOKING_ID,PRESENTVIEW.EXPRESS_NO,PRESENTVIEW.TRAIN_NO, DATE_FORMAT(PRESENTVIEW.DEPARTURE_DATE,"%d-%b-%Y") as DEPARTURE_DATE,PRESENTVIEW.DEPARTURE_TIME,PRESENTVIEW.TOTAL_FC_SEATS,PRESENTVIEW.TOTAL_SC_SEATS,PRESENTVIEW.TOTAL_COST from EXPRESS,PRESENTVIEW where EXPRESS.EXPRESS_NO=PRESENTVIEW.EXPRESS_NO and ' +
          'presentview.user_id = ' +
          "'" +
          request.session.username +
          "'" +
          ' and current_timestamp() < EXPRESS.STARTING_TIME';
      con.query(quer, function (error, results, fields) {
          if (error) throw error;
          if (results.length <= 0)
             response.sendFile(path.join(__dirname, 'no_existing.html'));
          else 
             response.render('viewpresent.ejs', { result: results });
      });
  } else {
      response.redirect('/login');
  }
});

app.post('/showtable', function (request, response) {
  if (request.session.loggedin) {
  data = [request.body.from, request.body.to, request.body.date, request.body.fc, request.body.sc];
  var sqlquery =
  'select expressview.express_no,expressview.train_no,train.express_name,expressview.fromm,' +
  "expressview.too, DATE_FORMAT(departure_date,'%d-%b-%Y') as departure_date, departure_time from expressview,train where " +
  'expressview.train_no=train.train_no and fromm=? and too=? ' +
  'and DATE(?)=DATE(departure_date) and current_date() <= DATE(departure_date)' +
  'and FC_SEATS > ?' +
  'and SC_SEATS> ?';
  con.query(sqlquery, data, function (error, results, fields) {
      if (error) throw error;
      if(results.length<=0) response.sendFile(path.join(__dirname, 'showtrains_error.html'));
      else if(data[3]==0 && data[4]==0) response.sendFile(path.join(__dirname, 'invalid_error.html'));
      else
      response.render('showtrain.ejs', { result: results });
  });
  } else {
  response.redirect('/login');
}
});

app.post('/confirm', function (request, response) {
	if (request.session.loggedin) {
  	data1 = request.body.selection;
  	var data2 = [data1, data[3], data[4]];
  	response.render('reserve_ticket.ejs', { data: data2 });
	} else {
		response.redirect('/login');
	}
});

app.post('/cancel', function (request, response) {
  if (request.session.loggedin) {
      ticketno = request.body.selection;
      con.connect(function (err) {
          ticket = [];
          fina = [];
          function setValue(value) {
              ticket = value;
              console.log(ticket);
              console.log(ticket[0].BOOKING_ID);
              fina = [ticket[0].BOOKING_ID, ticket[0].EXPRESS_NO, ticket[0].TRAIN_NO, ticket[0].TOTAL_FC_SEATS, ticket[0].TOTAL_SC_SEATS, ticket[0].TOTAL_COST];
              console.log(fina);
          }
          var sql_train = 'select BOOKING_ID,EXPRESS_NO,TRAIN_NO,TOTAL_FC_SEATS,TOTAL_SC_SEATS,TOTAL_COST  FROM BOOKING WHERE BOOKING_ID =' + "'" + ticketno + "'";
          con.query(sql_train, function (error, results) {
              if (error) throw error;
              else {
                  setValue(results);
                  response.render('cancellation_confirm.ejs', { final: fina });
              }
          });
      });
  }
});

app.get('/cancel_confirm', function (request, response) {
  if (request.session.loggedin) {
      response.render('cancel.ejs', { ticketno: ticketno });
  } else {
      response.redirect('/login');
  }
});

app.post('/tocancel', function (request, response) {
  if (request.session.loggedin) {
      var password = request.body.pwd;
      con.query('SELECT * FROM user_details WHERE user_id =? AND password = ?', [request.session.username, password], function (error, results, fields) {
          if (results.length > 0) {
              var sql = 'delete from booking where booking_id = ' + "'" + ticketno + "'";
              con.query(sql, function (err, result) {
                  if (err) {
                      console.error('Error inserting!\n');
                      throw err;
                  } else {
                      response.sendFile(path.join(__dirname, 'cancelsuccess.html'));
                  }
              });
          } else {
              response.sendFile(path.join(__dirname, 'cancelerror.html'));
          }
      });
  } else {
      response.redirect('/login');
  }
});

app.post('/book', function (request, response) {
  if (request.session.loggedin) {
  con.connect(function (err) {
      var train = [];
      var total_cost;
      final = [];
      function setValue(value) {
          train = value;
          total_cost = data[3] * train[0].FC_PRICE + data[4] * train[0].SC_PRICE;
          final = [data1, train[0].TRAIN_NO, data[0], data[1], data[3], data[4], total_cost];
          console.log(final);
      }
      var sql_train =
          'select TRAIN.TRAIN_NO, TRAIN.FC_PRICE, TRAIN.SC_PRICE FROM TRAIN,EXPRESS WHERE TRAIN.TRAIN_NO = EXPRESS.TRAIN_NO AND EXPRESS.EXPRESS_NO=' + "'" + data1 + "'";
      con.query(sql_train, function (error, results) {
          if (error) throw error;
          else {
              setValue(results);
              response.render('payment.ejs', { final: final });
          }
      });
  });
  } else {
      response.redirect('/login');
    }
});

app.post('/pay', function (request, response) {
	if (request.session.loggedin) {
  	response.render('payment_confirm.ejs', { amount: final[6] });
	} else {
		response.redirect('/login');
	}
});

app.post('/topay', function (request, response) {
  if (request.session.loggedin) {
  var password = request.body.pwd;
  con.query('SELECT * FROM user_details WHERE user_id =? AND password = ?', [request.session.username, password], function (error, results, fields) {
      if (results.length > 0) {
          var sql =
              'insert into BOOKING(EXPRESS_NO,USER_ID,TRAIN_NO,TOTAL_FC_SEATS,TOTAL_SC_SEATS,TOTAL_COST) values(' +
              "'" +final[0]+"'"+','+"'" +request.session.username +"'" + ',' + "'" + final[1] +
              "'" + ',' +final[4] +',' +final[5] +',' +final[6] +')';
          con.query(sql, function (err, result) {
              if (err) {
                  console.error('Error inserting!\n');
                  throw err;
              } else {
                var updateview =
                'CREATE OR REPLACE VIEW EXPRESSVIEW AS SELECT EXPRESS_NO, TRAIN_NO, FROMM,' +
                ' TOO, DATE(STARTING_TIME) AS DEPARTURE_DATE, TIME(STARTING_TIME) AS DEPARTURE_TIME FROM EXPRESS';
                 con.query(updateview);
                  response.sendFile(path.join(__dirname, 'paysuccess.html'));
              }
          });
      } else {
          response.sendFile(path.join(__dirname, 'payerror.html'));
      }
  });
   } else {
  response.redirect('/login');
    }
});

app.get('/payagain', function (request, response) {
  if (request.session.loggedin) {
  response.render('payment_confirm.ejs', { amount: final[6] });
} else {
  response.redirect('/login');
}
});

app.get('/back',function(request,response){
	if (request.session.loggedin) {
  	response.sendFile(path.join(__dirname,'Login_success.html'));
	} else {
		response.redirect('/login');
	}
});

app.get('/logout',function(request,response){
	request.session.loggedin = false;
	request.session.username = ' ';
	response.redirect('/');
});

app.get('/logout_admin', function (req, res) {
  req.session.loggedin = false;
  res.redirect('/');
});

app.listen(port);
console.log("Server started at http://localhost:"+port);

