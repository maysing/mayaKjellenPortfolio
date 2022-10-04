const express = require('express')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const sqLite3 = require ('sqLite3')
const db = new sqLite3.Database("mayaKjellenPortfolioDb.db")

db.run(`

    CREATE TABLE IF NOT EXISTS works(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        link TEXT,
        course TEXT, 
        year INTEGER
    )
`)

const fieldEmpty = 0


const adminUsername = "maysing"
const adminPassword = "password1"

const app = express()

 
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



app.get('/', function(request, response){   
     response.render('start.hbs')
})

app.get('/about', function(request, response){   
    response.render('about.hbs')
})

app.get('/contact', function(request, response){   
    response.render('contact.hbs')
})

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


    if(inputErrors.length == 0){
        const query = "INSERT INTO works (title, link, course, year) VALUES (?, ?, ?, ?)"
    const values = [title, link, course, year]

        db.run(query, values, function(error){
            if(error){
                console.log(error)
            } else {
            response.redirect('/works')  
            }
        })
    } else {
        const model = {
            inputErrors
        }

        response.render('admin.hbs', model)
    }
})


app.get('/works', function(request, response){

    const query = "SELECT * FROM works ORDER BY id"

    db.all(query, function(error, works) {

        if(error) {
            console.log(error)
        } else {
            const model = {
              works
            }

        response.render('works.hbs', model) 
        }
   
    })

})


app.get("/works/:id", function(request, response){
	
	const id = request.params.id
	
	const query = "SELECT * FROM works WHERE id = ?"
    const values = [id]

    db.get(query, values, function(error, work){
        if(error){
            console.log(error)
        }else{const model = {
		work: work,
	}
	
	response.render('work.hbs', model)
            
        }
    })
	
})

app.get('/login', function(request, response){
    response.render('login.hbs')
})

 
app.listen(8080)