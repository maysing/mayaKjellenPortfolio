const express = require('express')
const expressHandlebars = require('express-handlebars')
const sqLite3 = require ('sqLite3')
const db = new sqLite3.Database("mayaKjellenPortfolioDb.db")
const expressSession = require('express-session')

const fieldEmpty = 0
const app = express()



const adminUsername = "maysing"
const adminPassword = "password1"

app.use(
	expressSession({
		saveUninitialized: false,
		resave: false,
		secret: "fsecufeoue"
	})
)

app.use(
	function(request, response, next){
		response.locals.session = request.session
		next()
	}
)

app.engine('hbs', expressHandlebars.engine({
    defaultLayout: 'main.hbs',
}))

app.use(
    express.static('public')
)

app.use(
	express.urlencoded({
		extended: false
	})
)

db.run(`

    CREATE TABLE IF NOT EXISTS works(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        link TEXT,
        course TEXT, 
        year INTEGER
    )
`)


db.run(`

    CREATE TABLE IF NOT EXISTS guests(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
    )
`)


//Start Page


app.get('/', function(request, response){

    const query = "SELECT * FROM guests ORDER BY id"

    const guestInputErrors = []

    db.all(query, function(error, guests) {

        if(error) {
            guestInputErrors.push("Internal error")
            
        } else {
            const model = {
              guests, 
              session: request.session
            }

        response.render('start.hbs', model) 
        }
   
    })

})


app.post('/', function(request, response){

    const name = request.body.name

    const guestInputErrors = []

    if(name.length == fieldEmpty){
        guestInputErrors.push("Title field can not be empty")
    }

    if(guestInputErrors.length == 0){
        const query = "INSERT INTO guests (name) VALUES (?)"
        const values = [name]

        db.run(query, values, function(error){
            if(error){
                guestInputErrors.push("Internal error")
            }

                const model = {
                    guestInputErrors
                }


            response.render('start.hbs', model)
            
        })

    }

})


//About Page

app.get('/about', function(request, response){   
    response.render('about.hbs')
})

//Contact Page

app.get('/contact', function(request, response){   
    response.render('contact.hbs')
})

//Administration/Posting Page

app.get('/admin', function(request, response){
    response.render('admin.hbs')
})

app.post('/admin', function(request, response){
    
    const title = request.body.title
    const link = request.body.link
    const course = request.body.course
    const year = request.body.year


    const inputErrors = []

    if(title.length == fieldEmpty){
        inputErrors.push("Title field can not be empty")
    }

    if(year.length == fieldEmpty){
        inputErrors.push("Year field can not be empty")
    }

    if(isNaN(year)){
		errorMessages.push("Year must be a number")

    } else if(year < 0){
        inputErrors.push("The year can not be negative")
    }


    if(inputErrors.length == 0){
        const query = "INSERT INTO works (title, link, course, year) VALUES (?, ?, ?, ?)"
        const values = [title, link, course, year]

        db.run(query, values, function(error){
            if(error){
                inputErrors.push("Internal error")
            } else {
            response.redirect('/works')  
            }
        })

    } else {
        const model = {
            inputErrors
        }

        if(!request.session.isLoggedIn){
            inputErrors.push("Not logged in")
        }

        response.render('admin.hbs', model)
    }
})


//Works Page

app.get('/works', function(request, response){

    const query = "SELECT * FROM works ORDER BY id"

    const inputErrors = []

    db.all(query, function(error, works) {

        if(error) {
            inputErrors.push("Internal error")
            
        } else {
            const model = {
              works
            }

        response.render('works.hbs', model) 
        }
   
    })

})


//Individual Work Page

app.get("/works/:id", function(request, response){
	
	const id = request.params.id
	
	const query = "SELECT * FROM works WHERE id = ?"
    const values = [id]

    db.get(query, values, function(error, work){
        if(error){
            inputErrors.push("Internal error")
            
        }else{const model = {
		work: work,
	}


	
	response.render('work.hbs', model)
            
        }
    })
	
})


//Log in Page

app.get('/login', function(request, response){
    response.render('login.hbs')
})

app.post("/login", function(request, response){

	const password = request.body.password
	const username = request.body.username
	
	
	if(username == adminUsername && password == adminPassword){
		
		request.session.isLoggedIn = true
		
		response.redirect("/admin")
	
        
	}else{
		
		const model = {
			failedToLogin: true
		}

		
		response.render('login.hbs', model)
	}
})

 
app.listen(8080)