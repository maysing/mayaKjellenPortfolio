const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqLite3 = require("sqLite3");
const db = new sqLite3.Database("mayaKjellenPortfolioDb.db");
const expressSession = require("express-session");
const app = express();
const bcrypt = require("bcrypt");
const fieldEmpty = 0;

//login info
const adminUsername = "maya";
const adminPassword =
  "$2b$10$LwMJi.ZPYKnjA2Y5.R4aKOLpO95ENUjcKypLBq1THtAYNC2SU.0Ty";

app.use(
  expressSession({
    saveUninitialized: false,
    resave: false,
    secret: "fsecufeoue",
  })
);
app.use(function (request, response, next) {
  response.locals.session = request.session;
  next();
});
app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);
app.use(express.static("public"));
app.use(
  express.urlencoded({
    extended: false,
  })
);
//Create databases
db.run(`
    CREATE TABLE IF NOT EXISTS works(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        link TEXT,
        course TEXT, 
        year INTEGER
    )
`);
db.run(`
    CREATE TABLE IF NOT EXISTS guests(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
    )
`);
db.run(`
    CREATE TABLE IF NOT EXISTS reviews(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, 
        comment TEXT
    )
`);

//Start Page
app.get("/", function (request, response) {
  const query = "SELECT * FROM guests ORDER BY id";
  const guestInputErrors = [];
  db.all(query, function (error, guests) {
    if (error) {
      guestInputErrors.push("Internal error");
    } else {
      const model = {
        guests,
        session: request.session,
      };

      response.render("start.hbs", model);
    }
  });
});

app.post("/", function (request, response) {
  const name = request.body.name;

  const query = "INSERT INTO guests (name) VALUES (?)";
  const values = [name];

  db.run(query, values, function (error) {
    response.redirect("/");
  });
});

app.post("/delete-guest/:id", function (request, response) {
  const id = request.params.id;

  const query = `DELETE FROM guests WHERE id = ?`;

  db.run(query, id, function (error) {
    response.redirect("/");
  });
});

app.get("/update-guest/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM guests WHERE id = ?";

  const values = [id];

  db.get(query, values, function (error, guests) {
    const model = {
      guest: guests,
    };
    response.render("updateGuest.hbs", model);
  });
});

app.post("/update-guest/:id", function (request, response) {
  const id = request.params.id;
  const name = request.body.name;
  const values = [name, id];

  const query = `UPDATE guests SET name = ? WHERE id = ?`;

  db.run(query, values, function (error) {
    response.redirect("/");
  });
});

//About Page
app.get("/about", function (request, response) {
  response.render("about.hbs");
});
//Contact Page
app.get("/contact", function (request, response) {
  response.render("contact.hbs");
});
//Administration/Posting Page
app.get("/admin", function (request, response) {
  response.render("admin.hbs");
});
app.post("/admin", function (request, response) {
  const title = request.body.title;
  const link = request.body.link;
  const course = request.body.course;
  const year = request.body.year;
  const inputErrors = [];
  if (title.length == fieldEmpty) {
    inputErrors.push("Title field can not be empty");
  }
  if (year.length == fieldEmpty) {
    inputErrors.push("Year field can not be empty");
  }

  if (isNaN(year)) {
    inputErrors.push("Year must be a number");
  } else if (year < 0) {
    inputErrors.push("The year can not be negative");
  }
  if (inputErrors.length == 0 && request.session.isLoggedIn == true) {
    const query =
      "INSERT INTO works (title, link, course, year) VALUES (?, ?, ?, ?)";
    const values = [title, link, course, year];
    db.run(query, values, function (error) {
      if (error) {
        inputErrors.push("Internal error");
      } else {
        response.redirect("/works");
      }
    });
  } else {
    const model = {
      inputErrors,
    };

    if (!request.session.isLoggedIn) {
      inputErrors.push("Not logged in");
    }
    response.render("admin.hbs", model);
  }
});
//Works Page
app.get("/works", function (request, response) {
  const query = "SELECT * FROM works ORDER BY id";
  const inputErrors = [];
  db.all(query, function (error, works) {
    if (error) {
      inputErrors.push("Internal error");
    } else {
      const model = {
        works,
      };
      response.render("works.hbs", model);
    }
  });
});

//Individual Work Page
app.get("/works/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM works WHERE id = ?";
  const values = [id];
  db.get(query, values, function (error, work) {
    if (error) {
      inputErrors.push("Internal error");
    } else {
      const model = {
        work: work,
      };

      response.render("work.hbs", model);
    }
  });
});

//Delete Work

app.post("/delete-work/:id", function (request, response) {
  const id = request.params.id;

  const query = `DELETE FROM works WHERE id = ?`;

  db.run(query, id, function (error) {
    response.redirect("/works");
  });
});

//Update Work

app.get("/update-work/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM works WHERE id = ?";

  const values = [id];

  db.get(query, values, function (error, works) {
    const model = {
      works,
    };
    response.render("updateWork.hbs", model);
  });
});

app.post("/update-work/:id", function (request, response) {
  const id = request.params.id;

  const title = request.body.title;
  const link = request.body.link;
  const course = request.body.course;
  const year = request.body.year;

  const inputErrors = [];

  const query = `UPDATE works SET title = ?, link = ?, course = ?, year = ? WHERE id = ?`;
  const values = [title, link, course, year, id];

  if (inputErrors.length == 0) {
    db.run(query, values, function (error) {
      response.redirect("/works");
    });
  }
});

//Log in Page

app.get("/login", function (request, response) {
  response.render("login.hbs");
});
app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  if (enteredUsername == adminUsername) {
    bcrypt.compare(enteredPassword, adminPassword, function (error, result) {
      if (result) {
        request.session.isLoggedIn = true;
        response.redirect("/");
      } else {
        const model = {
          failedToLogin,
        };
        response.redirect("/login");
        response.render("login.hbs", model);
      }
    });
  } else {
    const model = {
      failedToLogin: true,
    };
    response.render("login.hbs", model)
  }
});

//Review Page

app.get("/reviews", function (request, response) {
  const query = "SELECT * FROM reviews ORDER BY id";
  const inputErrors = [];
  db.all(query, function (error, reviews) {
    if (error) {
      inputErrors.push("Internal error");
    } else {
      const model = {
        reviews,
      };
      response.render("reviews.hbs", model);
    }
  });
});

app.post("/reviews", function (request, response) {
  const name = request.body.name;
  const comment = request.body.comment;

  const query = "INSERT INTO reviews (name, comment) VALUES (?, ?)";
  const values = [name, comment];

  db.run(query, values, function (error) {
    response.redirect("/reviews");
  });
});

app.get("/update-review/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM reviews WHERE id = ?";

  const values = [id];

  db.get(query, values, function (error, reviews) {
    const model = {
      reviews,
    };
    response.render("updateReview.hbs", model);
  });
});

app.post("/update-review/:id", function (request, response) {
  const id = request.params.id;

  const name = request.body.name;
  const comment = request.body.comment;

  const query = `UPDATE reviews SET name = ?, comment = ? WHERE id = ?`;
  const values = [name, comment, id];

  db.run(query, values, function (error) {
    response.redirect("/reviews");
  });
});

app.post("/delete-review/:id", function (request, response) {
  const id = request.params.id;

  const query = `DELETE FROM reviews WHERE id = ?`;

  db.run(query, id, function (error) {
    response.redirect("/reviews");
  });
});

app.get("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/login");
});

app.listen(8080);
