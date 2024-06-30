import express from "express"
import mysql from "mysql"
import cors from "cors"
import bodyParser from "body-parser";
import https from "https";
import fs from "fs";
import path from "path";
import {format, parseISO, differenceInMinutes} from 'date-fns';
// import * as dotenv from 'dotenv'
import dotenv from 'dotenv'
dotenv.config()
const app = express()
const DATETIME_FORMAT = '%Y-%m-%dT%T.%fZ'

console.log(process.env.RDS_HOSTNAME)

var mysql_pool = mysql.createPool({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : process.env.RDS_DATABASE,
	timezone: 'UTC'
});

app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

// const middleware = (req, res, next) => {
// 	let input_token = atob(req.headers.authorization)
// 	if (input_token === process.env.RDS_API_TOKEN) {
// 		next()
// 	} else {
// 		res.status(403)
// 		res.send("Token invalid.")
// 	}
// }; 

function authentication(req, res, next) {
    const authheader = req.headers.authorization;
    // console.log(req.headers);
 
    if (!authheader) {
        let err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        return next(err)
    }
 	
 	try {
		const input_token = new Buffer.from(authheader.split(' ')[1], 'base64').toString();

		if (input_token === process.env.RDS_API_TOKEN) {
	        next();
	    } else {
	        let err = new Error('You are not authenticated!');
	        res.setHeader('WWW-Authenticate', 'Basic');
	        err.status = 401;
	        return next(err);
	    }
	} catch (token_process_err) {
		let token_process_msg = "cannot process token. " + token_process_err
		console.log(token_process_msg)
    	res.status(401);
    	res.send(token_process_msg);
    	return;
	}
}

app.get("/", (req,res) => {
    res.json("hello this is backend")
})

app.get("/accounts/all", authentication, (req, res) => {
    const query = "select * from Accounts"
    const bind = req.params.address
    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/account/:address", authentication, (req, res) => {
    let query = "select * from Accounts where LOWER(address) = LOWER(?)"
    const bind = req.params.address

    if ('is_removed' in req.query) {
		if (req.query.is_removed === 'false') {
			query += " and removed_date is null"
		} else if (req.query.is_removed === 'true') {
			query += " and removed_date is not null"
		} else {
			res.status(400);
    		res.send("<is_removed> must be 'false' or 'true'");
    		return;
		}
	}
    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/account", authentication, (req, res) => {
    let query = "select * from Accounts"

    let conditions = []
    let bind = []
    if (Object.keys(req.query).length > 0) {
    	if ('username' in req.query) {
			conditions.push("username = ?")
			bind.push(req.query.username)
		} else if ('email' in req.query) {
			conditions.push("email = ?")
			bind.push(decodeURIComponent(req.query.email))
		}

		if (conditions.length > 0) {
			let condition_str = " where " + conditions.join(" and ")
			query += condition_str
		} else {
			res.status(400);
    		res.send("request.query invalid");
    		return;
		}
    } else {
    	res.status(400);
    	res.send("request.query not found");
    	return;
    }
    
    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/all_accounts_except", authentication, (req, res) => {
    const query = "select address, username from Accounts where address != ? and removed_date is null order by username"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/account", authentication, (req, res) => {
    const query = "insert into Accounts (Address, username, thai_id) values (?, ?, ?)"
    let bind = []

    if (!('address' in req.body)) {
		res.status(400);
    	res.send("input 'address' not found");
    	return;
	} else if (!('username' in req.body)) {
		res.status(400);
    	res.send("input 'username' not found");
    	return;
	} else if (!('thai_id' in req.body)) {
		res.status(400);
    	res.send("input 'thai_id' not found");
    	return;
	} else {
		bind = [req.body.address, req.body.username, req.body.thai_id]
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.patch("/account/:address", authentication, (req, res) => {

    let query = "UPDATE Accounts SET"
  	let params_query_list = []
    let bind = []

    if ('thai_id' in req.body) {
		params_query_list.push("thai_id" + " = ?")
		bind.push(req.body.thai_id)
	} 
	if ('username' in req.body) {
		params_query_list.push("username" + " = ?")
		bind.push(req.body.username)
	} 

	if (params_query_list.length > 0) {
		query += " " + params_query_list.join(" , ") + " WHERE address = ?"
		bind.push(req.params.address)
	} else {
		res.status(400);
    	res.send("No input detail to patch");
    	return;
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})


app.post("/is_event_owner", authentication, (req, res) => {
    const query = "select * from Accounts as a join Events as e on (a.address = e.creator) where a.address = ? and a.removed_date is null and e.event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 2) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.get("/events", authentication, (req, res) => {
    let query = "select * from Events"

	let conditions = []
    let bind = []
    if (Object.keys(req.query).length > 0) {
		if ('event_id' in req.query) {
			let event_sql = "event_id "
			let event_list = req.query.event_id.split(',')

			if (event_list.length === 1) {
				event_sql += "= ?"
				conditions.push(event_sql)
				bind.push(event_list[0])
			} else if (event_list.length > 1) {
				event_sql += "in ("
				for (let t_index = 0; t_index < event_list.length; t_index += 1) {
					event_sql += "?,"
					bind.push(event_list[t_index])
				}
				event_sql = event_sql.slice(0, -1) + ")"
				conditions.push(event_sql)
			}
		}
		if ('is_selling' in req.query) {
			if (req.query.is_selling === 'false') {
				conditions.push("NOT(NOW() >= date_sell and NOW() < date_event)")
			} else if (req.query.is_selling === 'true') {
				conditions.push("NOW() >= date_sell and NOW() < date_event")
			} else {
				res.status(400);
				res.send("<is_selling> must be 'false' or 'true'");
				return;
			}
		}

		if (conditions.length > 0) {
			let condition_str = " where " + conditions.join(" and ")
			query += condition_str
		} else {
			res.status(400);
    		res.send("request.query invalid");
    		return;
		}
		
    } else {
    	res.status(400);
    	res.send("request.query not found");
    	return;
    }

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/events/:event_id", authentication, (req, res) => {
    let query = "select * from Events where event_id = ?"
    const bind = req.params.event_id

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/events/:event_id/seats", authentication, (req, res) => {
    let query = "select * from Seats where event_id = ?"
    const bind = [req.params.event_id]

    if ('is_owned' in req.query) {
		if (req.query.is_owned === 'false') {
			query += " and owner is null"
		} else if (req.query.is_owned === 'true') {
			query += " and owner is not null"
		} else {
			res.status(400);
    		res.send("<is_owned> must be 'false' or 'true'");
    		return;
		}
	}

	if ('zone' in req.query) {
		query += " and zone = ?"
		bind.push(req.query.zone)
	}

	if ('owner' in req.query) {
		query += " and owner = ?"
		bind.push(req.query.owner)
	}

	query += " order by zone, seat_row, seat_id"

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data);
			} else {
				if (rows.length > 0) {
					let booking_data = ""
					try {
						booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
					} catch (checkbooking_err) {
						let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
						console.log(checkbooking_msg)
				    	res.status(500);
				    	res.send(checkbooking_msg);
				    	return;
					}

					for (let r_index = 0; r_index < rows.length; r_index++) {
						let this_ticket_regex = new RegExp(`${rows[r_index]["ticket_id"]},[^\n]+`);
					    let ticket_booking_match = booking_data.match(this_ticket_regex)
					    if (ticket_booking_match !== null) {
					    	let ticket_booking_detail = ticket_booking_match[0].split(',',3)
					    	let this_booking_by = ticket_booking_detail[1]
					    	let this_booking_date = ticket_booking_detail[2]
					    	let year = this_booking_date.slice(0,4)
					    	let month = this_booking_date.slice(4,6)
					    	let day = this_booking_date.slice(6,8)
					    	let hr = this_booking_date.slice(8,10)
					    	let min = this_booking_date.slice(10,12)
					    	this_booking_date = parseISO(year + '-' + month + '-' + day + 'T' + hr + ':' + min + ':00')
					    	rows[r_index]['booking_by'] = this_booking_by
					    	rows[r_index]['booking'] = this_booking_date
					    }
					}
				}
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/event_of_account", authentication, (req, res) => {
    const query = "select event_id, event_name, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where creator = ? and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 2) {
    	res.status(400);
    	res.send('request invalid.');
    	return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/events_of_account", authentication, (req, res) => {
    const query = "select event_id, event_name, DATE_FORMAT(date_sell, '%d %b %Y %T') as date_sell from Events where creator = ?"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    	return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/create_event", authentication, (req, res) => {
    const query = "insert into Events (creator, date_event, date_sell, detail, event_name, purchase_limit, venue) values (?, STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), ?, ?, ?, ?)"
    const bind = req.body.bind
    if (bind.length !== 7) {
    	res.status(400);
    	res.send('request invalid.');
    	return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
    
})


app.post("/delete_event", authentication, (req, res) => {
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    	return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		  	const event_id = bind[1]
		  	const del_hold_transfer_sql = "delete from Hold_transfer where event_id = ?"
		    connection.query(del_hold_transfer_sql, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err_step"] = err2;
	                data["err"] = err2;
	                console.log("error 'del_hold_transfer'")
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					console.log("Hold_transfer is deleted.")
					// res.json(rows); 
				}
		    });
		    const del_event_seats_sql = "delete from Seats where event_id = ?"
		    connection.query(del_event_seats_sql, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err_step"] = err2;
	                data["err"] = err2;
	                console.log("error 'del_event_seats'")
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					console.log("seats is deleted.")
					// res.json(rows); 
				}
		    });
		    const del_event_sql = "delete from Events where event_id = ?"
		    connection.query(del_event_sql, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err_step"] = err2;
	                data["err"] = err2;
	                console.log("error 'del_event'")
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					console.log("event is deleted.")
					// res.json(rows); 
					res.end(); 
				}
		    });

		    connection.release();
		});
    }
})


app.post("/update_event", authentication, (req, res) => {
    const query = "update Events set date_event = STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), date_sell = STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), detail = ?, event_name = ?, purchase_limit = ?, venue = ? where event_id = ? and creator = ?"
    const bind = req.body.bind
    if (bind.length !== 8) {
    	res.status(400);
    	res.send('request invalid.');
    	return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/update_hold_transfer", authentication, (req, res) => {
    const query = "update Hold_transfer set reciever = ? where ticket_id = ? and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 3) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/create_holdTicket_of_event", authentication, (req, res) => {
    const query = "insert into Hold_transfer (ticket_id, event_id, zone) values(?, ?, ?)"
    const bind = req.body.bind
    if (bind.length !== 3) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/update_holdSeats_of_event", authentication, (req, res) => {
    const query = "update Seats set is_hold = 'Y' where ticket_id in (select ticket_id from Hold_transfer where event_id = ?)"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/update_hold_transfer", authentication, (req, res) => {
    const query = "update Hold_transfer set reciever = ? where ticket_id = ? and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 3) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/unhold_tickets_of_event", authentication, (req, res) => {
    const query = "update Seats set is_hold = null where ticket_id in (select ticket_id from Hold_transfer where event_id = ? and reciever is null)"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/delete_hold_of_event", authentication, (req, res) => {
    const query = "delete from Hold_transfer where event_id = ? and reciever is null"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/my_hold_seats", authentication, (req, res) => {
    const query = "select s.*, h.reciever, h.event_id as eventid from Seats as s left join Hold_transfer as h on (s.ticket_id = h.ticket_id and s.event_id = h.event_id) where s.creator = ? and s.event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 2) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/giveAway_seats_of_event", authentication, (req, res) => {
    const query = "select h.ticket_id, h.reciever, s.zone, s.seat_row, s.seat_id, a.username from Hold_transfer h join Seats s on (h.ticket_id = s.ticket_id) left join Accounts a on (h.reciever = a.address) where h.event_id = ? and a.removed_date is null order by h.ticket_id"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.get("/seats/:ticket_id", authentication, (req, res) => {
    let query = "select * from Seats where ticket_id = ?"
    const bind = req.params.ticket_id

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				if (rows.length > 0) {
					let booking_data = ""
					try {
						booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
					} catch (checkbooking_err) {
						let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
						console.log(checkbooking_msg)
				    	res.status(500);
				    	res.send(checkbooking_msg);
				    	return;
					}

					for (let r_index = 0; r_index < rows.length; r_index++) {
						let this_ticket_regex = new RegExp(`${rows[r_index]["ticket_id"]},[^\n]+`);
					    let ticket_booking_match = booking_data.match(this_ticket_regex)
					    if (ticket_booking_match !== null) {
					    	let ticket_booking_detail = ticket_booking_match[0].split(',',3)
					    	let this_booking_by = ticket_booking_detail[1]
					    	let this_booking_date = ticket_booking_detail[2]
					    	let year = this_booking_date.slice(0,4)
					    	let month = this_booking_date.slice(4,6)
					    	let day = this_booking_date.slice(6,8)
					    	let hr = this_booking_date.slice(8,10)
					    	let min = this_booking_date.slice(10,12)
					    	this_booking_date = parseISO(year + '-' + month + '-' + day + 'T' + hr + ':' + min + ':00')
					    	rows[r_index]['booking_by'] = this_booking_by
					    	rows[r_index]['booking'] = this_booking_date
					    }
					}
				}
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/seats", authentication, (req, res) => {
    let query = "select * from Seats"

    let conditions = []
    let bind = []
    if (Object.keys(req.query).length > 0) {
    	if ('owner' in req.query) {
			conditions.push("owner = ?")
			bind.push(req.query.owner)
		} 
		if ('event_id' in req.query) {
			conditions.push("event_id = ?")
			bind.push(req.query.event_id)
		}
		if ('ticket_id' in req.query) {
			let ticket_sql = "ticket_id "
			let ticket_list = req.query.ticket_id.split(',')

			if (ticket_list.length === 1) {
				ticket_sql += "= ?"
				conditions.push(ticket_sql)
				bind.push(ticket_list[0])
			} else if (ticket_list.length > 1) {
				ticket_sql += "in ("
				for (let t_index = 0; t_index < ticket_list.length; t_index += 1) {
					ticket_sql += "?,"
					bind.push(ticket_list[t_index])
				}
				ticket_sql = ticket_sql.slice(0, -1) + ")"
				conditions.push(ticket_sql)
			}
		}

		if (conditions.length > 0) {
			let condition_str = " where " + conditions.join(" and ")
			query += condition_str
		} else {
			res.status(400);
    		res.send("request.query invalid");
    		return;
		}
		// console.log(query)
    } else {
    	res.status(400);
    	res.send("request.query not found");
    	return;
    }

	query += " order by event_id, zone, seat_row, seat_id"

	console.log(new Date())
    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
		console.log(new Date())
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				if (rows.length > 0) {
					let booking_data = ""
					try {
						booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
					} catch (checkbooking_err) {
						let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
						console.log(checkbooking_msg)
				    	res.status(500);
				    	res.send(checkbooking_msg);
				    	return;
					}

					for (let r_index = 0; r_index < rows.length; r_index++) {
						let this_ticket_regex = new RegExp(`${rows[r_index]["ticket_id"]},[^\n]+`);
					    let ticket_booking_match = booking_data.match(this_ticket_regex)
					    if (ticket_booking_match !== null) {
					    	let ticket_booking_detail = ticket_booking_match[0].split(',',3)
					    	let this_booking_by = ticket_booking_detail[1]
					    	let this_booking_date = ticket_booking_detail[2]
					    	let year = this_booking_date.slice(0,4)
					    	let month = this_booking_date.slice(4,6)
					    	let day = this_booking_date.slice(6,8)
					    	let hr = this_booking_date.slice(8,10)
					    	let min = this_booking_date.slice(10,12)
					    	this_booking_date = parseISO(year + '-' + month + '-' + day + 'T' + hr + ':' + min + ':00')
					    	rows[r_index]['booking_by'] = this_booking_by
					    	rows[r_index]['booking'] = this_booking_date
					    }
					}
				}
				res.json(rows); 
			}
			connection.release();
	    });
		console.log(new Date())
	});
})

app.post("/get_seats", authentication, (req, res) => {
    let query = "select * from Seats"

    let conditions = []
    let bind = []
    if ('ticket_id' in req.body) {
    	if (!Array.isArray(req.body.ticket_id)) {
    		res.status(400);
	    	res.send("ticket_id must be list");
	    	return;
    	} else if (req.body.ticket_id.length == 0) {
			res.status(400);
	    	res.send("no input ticket_id(s)");
	    	return;
    	} else {
    		query += " WHERE ticket_id in ("
    		for (let t_index = 0; t_index < req.body.ticket_id.length; t_index += 1) {
				query += "?,"
			}
			query = query.slice(0, -1) + ")"
			bind.push(...req.body.ticket_id)
    	}
	} else {
		res.status(400);
    	res.send("ticket_id is required");
    	return;
	}

	query += " order by event_id, zone, seat_row, seat_id"

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				if (rows.length > 0) {
					let booking_data = ""
					try {
						booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
					} catch (checkbooking_err) {
						let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
						console.log(checkbooking_msg)
				    	res.status(500);
				    	res.send(checkbooking_msg);
				    	return;
					}

					for (let r_index = 0; r_index < rows.length; r_index++) {
						let this_ticket_regex = new RegExp(`${rows[r_index]["ticket_id"]},[^\n]+`);
					    let ticket_booking_match = booking_data.match(this_ticket_regex)
					    if (ticket_booking_match !== null) {
					    	let ticket_booking_detail = ticket_booking_match[0].split(',',3)
					    	let this_booking_by = ticket_booking_detail[1]
					    	let this_booking_date = ticket_booking_detail[2]
					    	let year = this_booking_date.slice(0,4)
					    	let month = this_booking_date.slice(4,6)
					    	let day = this_booking_date.slice(6,8)
					    	let hr = this_booking_date.slice(8,10)
					    	let min = this_booking_date.slice(10,12)
					    	this_booking_date = parseISO(year + '-' + month + '-' + day + 'T' + hr + ':' + min + ':00')
					    	rows[r_index]['booking_by'] = this_booking_by
					    	rows[r_index]['booking'] = this_booking_date
					    }
					}
				}
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/seats/:ticket_id", authentication, (req, res) => {
    let query = "UPDATE Seats SET"
  	let params_query_list = []
    let bind = []

    if ('transaction' in req.body) {
		params_query_list.push("transaction = ?")
		bind.push(req.body.transaction)
	} 
	if ('owner' in req.body) {
		params_query_list.push("owner = ?")
		bind.push(req.body.owner)
	} 
	if ('booking' in req.body) {
		params_query_list.push("booking = ?")
		bind.push(req.body.booking)
	}
	if ('is_hold' in req.body) {
		params_query_list.push("is_hold = ?")
		bind.push(req.body.is_hold)
	}
	if ('is_use' in req.body) {
		params_query_list.push("is_use = ?")
		bind.push(req.body.is_use)
	}
	if ('in_marketplace' in req.body) {
		params_query_list.push("in_marketplace = STR_TO_DATE(?, '" + DATETIME_FORMAT + "')")
		bind.push(req.body.in_marketplace)
	}
	if ('seller' in req.body) {
		params_query_list.push("seller = ?")
		bind.push(req.body.seller)
	}
	if ('orderid' in req.body) {
		params_query_list.push("orderid = ?")
		bind.push(req.body.orderid)
	}

	if (params_query_list.length > 0) {
		query += " " + params_query_list.join(" , ") + " WHERE ticket_id = ?"
		bind.push(req.params.ticket_id)
	} else {
		res.status(400);
    	res.send("No input detail to patch");
    	return;
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/unbook_all_seats", authentication, (req, res) => {
	let o_now = new Date()
	let query = "UPDATE Seats SET booking_by = null, booking = null WHERE ticket_id in ("

	let booking_data = ""
	try {
		booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
	} catch (checkbooking_err) {
		let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
		console.log(checkbooking_msg)
    	res.status(500);
    	res.send(checkbooking_msg);
    	return;
	}

	let booking_list = booking_data.split("\n")
	let tobe_remove_id = []
	
	for (let b_index = 0; b_index < booking_list.length; b_index++) {
		let booking_row = booking_list[b_index].trim()
		if (booking_row !== "") {
			let ticket_booking_detail = booking_row.split(',',3)
	    	let this_ticket_id = ticket_booking_detail[0]
	    	let this_booking_by = ticket_booking_detail[1]
	    	let this_booking_date = ticket_booking_detail[2]
	    	let year = this_booking_date.slice(0,4)
	    	let month = this_booking_date.slice(4,6)
	    	let day = this_booking_date.slice(6,8)
	    	let hr = this_booking_date.slice(8,10)
	    	let min = this_booking_date.slice(10,12)
	    	this_booking_date = parseISO(year + '-' + month + '-' + day + 'T' + hr + ':' + min + ':00')

	    	let diff_mins = differenceInMinutes(o_now, this_booking_date)
	    	// console.log(this_ticket_id)
	    	// console.log("booking_date = " + this_booking_date)
	    	// console.log("o_now = " + o_now)
	    	// console.log(diff_mins)
	    	if (diff_mins > 15) {
	    		tobe_remove_id.push(this_ticket_id)
	    		let this_line_regex = new RegExp(`${this_ticket_id},[^\n]+\n`, 'g');
				booking_data = booking_data.replace(this_line_regex, '')
	    	}
		}
	}

	if (tobe_remove_id.length > 0) {
		try {
			fs.writeFileSync(process.env.STORE_FILEPATH, booking_data)
			console.log("File written successfully");
		} catch (writefile_err) {
			let writefile_msg = "File written failed. " + writefile_err
			console.log(writefile_msg)
	    	res.status(500);
	    	res.send(writefile_msg);
	    	return;
		}

		for (let t_index = 0; t_index < tobe_remove_id.length; t_index += 1) {
			query += "?,"
		}
		query = query.slice(0, -1) + ")"
		mysql_pool.getConnection(function(con_err, connection) {
			if (con_err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
	            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
				console.log(data["err"])
				res.status(500);
				res.json(data); 
				return;
		  	}
		    connection.query(query, tobe_remove_id,function(update_err, rows) {	
		    	if (update_err) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = "Cannot update booking on Seats Table; " + update_err;
					console.log(data["err"])
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
	} else {
		console.log("no data to update.")
		res.status(200);
		res.send("no data to update.");
	}
	
})

app.post("/unbook_seats", authentication, (req, res) => {
	let o_now = new Date()
    let query = "UPDATE Seats SET booking_by = null, booking = null WHERE ticket_id in ("
    let bind = []

    if ('ticket_id' in req.body) {
    	if (!Array.isArray(req.body.ticket_id)) {
    		res.status(400);
	    	res.send("ticket_id must be list");
	    	return;
    	} else if (req.body.ticket_id.length == 0) {
			res.status(400);
	    	res.send("no input ticket_id(s)");
	    	return;
    	} else {
    		for (let t_index = 0; t_index < req.body.ticket_id.length; t_index += 1) {
				query += "?,"
			}
			query = query.slice(0, -1) + ")"
			bind.push(...req.body.ticket_id)
    	}
	} else {
		res.status(400);
    	res.send("ticket_id is required");
    	return;
	}

	let booking_data = ""
	try {
		booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
		for (let t_index = 0; t_index < req.body.ticket_id.length; t_index += 1) {
			let this_line_regex = new RegExp(`${req.body.ticket_id[t_index]},[^\n]+\n`, 'g');
			booking_data = booking_data.replace(this_line_regex, '')
		}

	} catch (checkbooking_err) {
		let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
		console.log(checkbooking_msg)
    	res.status(500);
    	res.send(checkbooking_msg);
    	return;
	}

	try {
		fs.writeFileSync(process.env.STORE_FILEPATH, booking_data)
		console.log("File written successfully");
	} catch (writefile_err) {
		let writefile_msg = "File written failed. " + writefile_err
		console.log(writefile_msg)
    	res.status(500);
    	res.send(writefile_msg);
    	return;
	}


	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(update_err, rows) {	
	    	if (update_err) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = "Cannot update booking on Seats Table; " + update_err;
				console.log(data["err"])
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/book_seats", authentication, (req, res) => {
	let o_now = new Date()
    let query = "UPDATE Seats SET booking_by = ?, booking = ? WHERE ticket_id in ("
    let seat_id_bind_str = ""
    let bind = []

    if ('account' in req.body) {
    	bind.push(req.body.account)
    	bind.push(o_now)
	} else {
		res.status(400);
    	res.send("account is required");
    	return;
	}

    if ('ticket_id' in req.body) {
    	if (!Array.isArray(req.body.ticket_id)) {
    		res.status(400);
	    	res.send("ticket_id must be list");
	    	return;
    	} else if (req.body.ticket_id.length == 0) {
			res.status(400);
	    	res.send("no input ticket_id(s)");
	    	return;
    	} else {
    		// read store file
    		let booking_data = ""
    		try {
    			booking_data = fs.readFileSync(process.env.STORE_FILEPATH,'utf8')
    		} catch (checkbooking_err) {
    			let checkbooking_msg = "cannot read STORE file. " + checkbooking_err
    			console.log(checkbooking_msg)
		    	res.status(500);
		    	res.send(checkbooking_msg);
		    	return;
    		}

    		for (let t_index = 0; t_index < req.body.ticket_id.length; t_index += 1) {
				seat_id_bind_str += "?,"

				// check if ticket_id already booked.
				let ticketid_str = req.body.ticket_id[t_index] + ","
				if (booking_data.includes(ticketid_str)) {
					let already_booked_msg = "this ticket_id (" + req.body.ticket_id[t_index] + ") has been booked."
					console.log(already_booked_msg)
					res.status(400);
					res.send(already_booked_msg);
					return;
				}
			}
			seat_id_bind_str = seat_id_bind_str.slice(0, -1)
			query += seat_id_bind_str + ")"
			bind.push(...req.body.ticket_id)
    	}
	} else {
		res.status(400);
    	res.send("ticket_id is required");
    	return;
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}

	    connection.query(query, bind,function(update_err, rows) {	
	    	if (update_err) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = "Cannot update booking on Seats Table; " + update_err;
				console.log(data["err"])
				res.status(500);
				res.json(data); 
			} else {
				try {
				  	let content = "";
				  	let o_now_str = format(o_now, 'yyyyMMddHHmm');
				  	for (let t_index = 0; t_index < req.body.ticket_id.length; t_index += 1) {
						content += req.body.ticket_id[t_index] + "," + req.body.account + "," + o_now_str + "\n"
					}
				  	fs.appendFileSync(process.env.STORE_FILEPATH, content);
				  	console.log('File written successfully');
				} catch (write_file_err) {
					let write_file_msg = 'Error writing Store file:' + write_file_err
					console.error(write_file_msg);
					res.status(500);
					res.send(write_file_msg);
					return;
				}
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/seat_prices_of_event", authentication, (req, res) => {
    const query = "select distinct ROUND(price/1000000000000000000, 2) as price from Seats where event_id = ? order by ROUND(price/1000000000000000000, 2) desc"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/available_seatCount_of_event", authentication, (req, res) => {
    const query = "select count(*) seat_count from Seats where owner is null and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/available_seats_of_event", authentication, (req, res) => {
    const query = "select s.ticket_id, s.seat_id, s.seat_row, s.zone, s.owner, s.is_use, a.thai_id from Seats s left join Accounts a on (s.owner = a.address) where s.event_id = ? and s.creator = ? and s.transaction is not null and s.is_use is null order by s.zone, s.seat_row, s.seat_id"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/create_seat", authentication, (req, res) => {
    const query = "insert into Seats (event_id, gas, price, seat_id, seat_row, zone, metadata, creator) values (?, ?, ?, ?, ?, ?, ?, ?)"
    const bind = req.body.bind
    if (bind.length !== 8) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/delete_seat", authentication, (req, res) => {
    const query = "delete from Seats where event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
		return;
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.get("/orders/:order_id", authentication, (req, res) => {
    let query = "select o.*, s.event_id from Orders o join Seats s on o.ticket_id = s.ticket_id where order_id = ?"
    const bind = req.params.order_id

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/orders", authentication, (req, res) => {
    let query = "select o.*, s.event_id from Orders o join Seats s on o.ticket_id = s.ticket_id"

    let conditions = []
    let bind = []
    if (Object.keys(req.query).length > 0) {
    	if ('event_id' in req.query) {
			conditions.push("event_id = ?")
			bind.push(req.query.event_id)
		} 
		if ('buyer' in req.query) {
			conditions.push("LOWER(buyer) = LOWER(?)")
			bind.push(req.query.buyer)
		}
		if ('order_id' in req.query) {
			let order_sql = "order_id "
			let order_list = req.query.order_id.split(',')

			if (order_list.length === 1) {
				order_sql += "= ?"
				conditions.push(order_sql)
				bind.push(order_list[0])
			} else if (order_list.length > 1) {
				order_sql += "in ("
				for (let t_index = 0; t_index < order_list.length; t_index += 1) {
					order_sql += "?,"
					bind.push(order_list[t_index])
				}
				order_sql = order_sql.slice(0, -1) + ")"
				conditions.push(order_sql)
			}
		}

		if ('ticket_id' in req.query) {
			let ticket_sql = "s.ticket_id "
			let ticket_list = req.query.ticket_id.split(',')

			if (ticket_list.length === 1) {
				ticket_sql += "= ?"
				conditions.push(ticket_sql)
				bind.push(ticket_list[0])
			} else if (ticket_list.length > 1) {
				ticket_sql += "in ("
				for (let t_index = 0; t_index < ticket_list.length; t_index += 1) {
					ticket_sql += "?,"
					bind.push(ticket_list[t_index])
				}
				ticket_sql = ticket_sql.slice(0, -1) + ")"
				conditions.push(ticket_sql)
			}
		}

		if (conditions.length > 0) {
			let condition_str = " where " + conditions.join(" and ")
			query += condition_str
		} else {
			res.status(400);
    		res.send("request.query invalid");
    		return;
		}

		if ('is_intime' in req.query) {
			if (req.query.is_intime === 'true') {
				query += " and created_date >= (NOW() - INTERVAL 60 MINUTE)"
			} else if (req.query.is_intime === 'false') {
				query += " and created_date < (NOW() - INTERVAL 60 MINUTE)"
			} else {
				res.status(400);
	    		res.send("<is_intime> must be 'false' or 'true'");
	    		return;
			}
		}

		if ('is_removed' in req.query) {
			if (req.query.is_removed === 'true') {
				query += " and removed_date IS NOT NULL"
			} else if (req.query.is_removed === 'false') {
				query += " and removed_date IS NULL"
			} else {
				res.status(400);
	    		res.send("<is_removed> must be 'false' or 'true'");
	    		return;
			}
		}
    } else {
    	res.status(400);
    	res.send("request.query not found");
    	return;
    }
    
    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/orders", authentication, (req, res) => {
    // const query = "insert into Orders (order_id, ticket_id, buyer, transaction, executed_date) values (?, ?, ?, ?, ?)"
    const query = "INSERT INTO Orders (order_id, ticket_id, buyer, func_name, seller, price, fee, executed_date) VALUES ?"
    let bind = []

    if (!('order_id' in req.body)) {
		res.status(400);
    	res.send("input 'order_id' not found");
    	return;
	} else if (!('buyer' in req.body)) {
		res.status(400);
    	res.send("input 'buyer' not found");
    	return;
    } else if (!('func_name' in req.body)) {
		res.status(400);
    	res.send("input 'func_name' not found");
    	return;
    } else if (!('price' in req.body)) {
		res.status(400);
    	res.send("input 'price' not found");
    	return;
    } else if (!('ticket_id' in req.body)) {
		res.status(400);
    	res.send("input 'ticket_id' not found");
    	return;
    } else if (!Array.isArray(req.body.ticket_id)) {
		res.status(400);
    	res.send("ticket_id must be list");
    	return;
    } else if (req.body.ticket_id.length == 0) {
		res.status(400);
    	res.send("no input ticket_id(s)");
    	return; 
	} else {
		// option
		let seller = null
		if ('seller' in req.body) {
			seller = req.body.seller
		}

		let fee = null
		if ('fee' in req.body) {
			fee = req.body.fee
		}

		let executed_date = null
		if ('executed_date' in req.body) {
			executed_date = req.body.executed_date
		}

		for (let t_index = 0; t_index < req.body.ticket_id.length; t_index++) {
		    bind.push([
				req.body.order_id, 
				req.body.ticket_id[t_index], 
				req.body.buyer, 
				req.body.func_name, 
				seller, 
				req.body.price,
				fee,
				executed_date,
			])
		}
		bind = [bind]
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})


app.post("/orders/:order_id", authentication, (req, res) => {
    let query = "UPDATE Orders SET"
  	let params_query_list = []
    let bind = []

    if ('buyer' in req.body) {
		params_query_list.push("buyer" + " = ?")
		bind.push(req.body.buyer)
	} 
	if ('seller' in req.body) {
		params_query_list.push("seller" + " = ?")
		bind.push(req.body.seller)
	} 
	if ('transaction' in req.body) {
		params_query_list.push("transaction" + " = ?")
		bind.push(req.body.transaction)
	} 
	if ('executed_date' in req.body) {
		params_query_list.push("executed_date" + " = ?")
		bind.push(req.body.executed_date)
	}
	if ('removed_date' in req.body) {
		params_query_list.push("removed_date" + " = ?")
		bind.push(req.body.removed_date)
	}
	if ('price' in req.body) {
		params_query_list.push("price" + " = ?")
		bind.push(req.body.price)
	}
	if ('fee' in req.body) {
		params_query_list.push("fee" + " = ?")
		bind.push(req.body.fee)
	}

	if (params_query_list.length > 0) {
		query += " " + params_query_list.join(" , ") + " WHERE order_id = ?"
		bind.push(req.params.order_id)
	} else {
		res.status(400);
    	res.send("No input detail to patch");
    	return;
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})


app.delete("/orders/:order_id", authentication, (req, res) => {
    let query = "UPDATE Orders SET removed_date = NOW() WHERE order_id = ?"
    let bind = []

	if (req.params.order_id) {
		bind.push(req.params.order_id)
	} else {
		res.status(400);
    	res.send("order_id is required.");
    	return;
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.delete("/orders/:order_id/seat/:ticket_id", authentication, (req, res) => {
    let query = "UPDATE Orders SET removed_date = NOW() WHERE order_id = ? and ticket_id = ?"
    let bind = []

	if (req.params.order_id && req.params.ticket_id) {
		bind = [req.params.order_id, req.params.ticket_id]
	} else {
		res.status(400);
    	res.send("order_id is required.");
    	return;
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/hold_tickets", authentication, (req, res) => {
    let query = "select s.* from Hold_transfer h join Seats s on h.ticket_id = s.ticket_id"

    let conditions = []
    let bind = []
    if (Object.keys(req.query).length > 0) {
    	if ('event_id' in req.query) {
			conditions.push("h.event_id = ?")
			bind.push(req.query.event_id)
		} 
		if ('receiver' in req.query) {
			conditions.push("LOWER(h.receiver) = LOWER(?)")
			bind.push(req.query.receiver)
		}
		if ('ticket_id' in req.query) {
			let ticket_sql = "ticket_id "
			let ticket_list = req.query.ticket_id.split(',')

			if (ticket_list.length === 1) {
				ticket_sql += "= ?"
				conditions.push(ticket_sql)
				bind.push(ticket_list[0])
			} else if (ticket_list.length > 1) {
				ticket_sql += "in ("
				for (let t_index = 0; t_index < ticket_list.length; t_index += 1) {
					ticket_sql += "?,"
					bind.push(ticket_list[t_index])
				}
				ticket_sql = ticket_sql.slice(0, -1) + ")"
				conditions.push(ticket_sql)
			}
		}

		if (conditions.length > 0) {
			let condition_str = " where " + conditions.join(" and ")
			query += condition_str
		} else {
			res.status(400);
    		res.send("request.query invalid");
    		return;
		}

		if ('is_redeemed' in req.query) {
			if (req.query.is_redeemed === 'false') {
				query += " and s.is_hold = 'Y'"
			} else if (req.query.is_redeemed === 'true') {
				query += " and s.is_hold = null"
			} else {
				res.status(400);
				res.send("<is_redeemed> must be 'false' or 'true'");
				return;
			}
		}
		
    } else {
    	res.status(400);
    	res.send("request.query not found");
    	return;
    }
    
    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/seats/purchase/:ticket_id", authentication, (req, res) => {
	let update_seat_sql = "UPDATE Seats SET transaction = ?, owner = ? WHERE ticket_id = ?"
	let update_order_sql = "UPDATE Orders SET transaction = ?, fee = ?, executed_date = NOW() WHERE ticket_id = ? and order_id = ?"
    let seat_bind = []
    let order_bind = []

    if (!('order_id' in req.body)) {
		res.status(400);
    	res.send("input 'order_id' not found");
    	return;
	} else if (!('buyer' in req.body)) {
		res.status(400);
    	res.send("input 'buyer' not found");
    	return;
    } else if (!('transaction' in req.body)) {
		res.status(400);
    	res.send("input 'transaction' not found");
    	return;
	} else if (!('fee' in req.body)) {
		res.status(400);
    	res.send("input 'fee' not found");
    	return;
	} else {
		seat_bind = [req.body.transaction, req.body.buyer, req.params.ticket_id]
		order_bind = [req.body.transaction, req.body.fee, req.params.ticket_id, req.body.order_id]
	}

	if ('is_2ndHand' in req.body) {
		update_seat_sql = "UPDATE Seats SET transaction = ?, owner = ?, in_marketplace = null, seller = null WHERE ticket_id = ?"
	}

	if ('is_redeem' in req.body) {
		update_seat_sql = "UPDATE Seats SET transaction = ?, owner = ?, is_hold = null WHERE ticket_id = ?"
	}

	mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(update_seat_sql, seat_bind,function(err1, rows) {	
	    	if (err1) {
	    		connection.release();
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err1;
				console.log(err1)
				res.status(500);
				res.json(data); 
				return;
			} else {
				// res.json(rows); 
			}
	    });
	    connection.query(update_order_sql, order_bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})


// https.createServer(
// 		{
// 			key: fs.readFileSync("key.pem"),
// 			cert: fs.readFileSync("cert.pem"),
// 	  	},
// 		app
// 	).listen(8800, ()=>{
//     console.log('server is runing at port 8800')
//   });
app.listen(8800, ()=>{
    console.log("connect from backend")
})

app.get("/timezone", authentication, (req, res) => {
    let query = "SELECT @@global.time_zone, @@session.time_zone"
    const bind = []

    mysql_pool.getConnection(function(con_err, connection) {
		if (con_err) {
			try {
				connection.release();
			} catch (disconnect_err) {
				console.log(disconnect_err)
			}
			var data = { "Time":"", "DatabaseStatus":"", "err": "" };
			data["Time"] = (new Date()).getTime();
			data["DatabaseStatus"] = "Down";
            data["err"] = 'Error getting mysql_pool connection: ' + con_err;
			console.log(data["err"])
			res.status(500);
			res.json(data); 
			return;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})