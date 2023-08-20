const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqLite3 = require("sqlite3");
const db = new sqLite3.Database("mayaKjellenPortfolioDb.db");
const expressSession = require("express-session");
const app = express();
const bcrypt = require("bcrypt");
const connectSqlite3 = require("connect-sqlite3");
const SQLiteStore = connectSqlite3(expressSession);

//login info
const adminUsername = "maya";
const hashedadminPassword =
  "$2b$10$LwMJi.ZPYKnjA2Y5.R4aKOLpO95ENUjcKypLBq1THtAYNC2SU.0Ty";

app.use(
  expressSession({
    store: new SQLiteStore({ db: "session-db.db" }),
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
      response.redirect("/error");
    } else {
      const model = {
        guests,
        session: request.session,
        guestInputErrors,
      };

      response.render("start.hbs", model);
    }
  });
});

app.post("/", function (request, response) {
  const name = request.body.name;
  const guestInputErrors = [];

  const query = "INSERT INTO guests (name) VALUES (?)";
  const values = [name];

  if (name.length == 0) {
    guestInputErrors.push("Must enter a name");
  }

  if (guestInputErrors.length == 0) {
    db.run(query, values, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/");
      }
    });
  } else {
    const query = "SELECT * FROM guests ORDER BY id";
    db.all(query, function (error, guests) {
      if (error) {
        response.redirect("/error");
      } else {
        const model = {
          guestInputErrors,
          guests,
        };

        response.render("start.hbs", model);
      }
    });
  }
});

app.post("/delete-guest/:id", function (request, response) {
  const id = request.params.id;
  const query = `DELETE FROM guests WHERE id = ?`;
  const notLoggedInError = [];

  if (request.session.isLoggedIn == true) {
    db.run(query, id, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/");
      }
    });
  } else {
    notLoggedInError.push("You are not logged in");

    const model = {
      notLoggedInError,
    };
    response.render("start.hbs", model);
  }
});

app.get("/update-guest/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM guests WHERE id = ?";
  const values = [id];
  const notLoggedInError = [];

  if (request.session.isLoggedIn == true) {
    db.get(query, values, function (error, guests) {
      if (error) {
        response.redirect("/error");
      } else {
        const model = {
          guest: guests,
        };
        response.render("updateGuest.hbs", model);
      }
    });
  } else {
    notLoggedInError.push("You are not logged in");

    const model = {
      notLoggedInError,
    };
    response.render("start.hbs", model);
  }
});

app.post("/update-guest/:id", function (request, response) {
  const id = request.params.id;
  const name = request.body.name;
  const values = [name, id];
  const guestInputErrors = [];
  const notLoggedInError = [];

  if (name.length == 0) {
    guestInputErrors.push("Must enter a name");
  }

  const query = `UPDATE guests SET name = ? WHERE id = ?`;

  if (guestInputErrors.length == 0 && request.session.isLoggedIn == true) {
    db.run(query, values, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/");
      }
    });
  }

  if (!request.session.isLoggedIn) {
    notLoggedInError.push("You are not logged in");

    const model = {
      notLoggedInError,
    };
    response.render("updateGuest.hbs", model);
  } else {
    const model = {
      guestInputErrors,
    };
    response.render("updateGuest.hbs", model);
  }
});

//About Page
app.get("/about", function (request, response) {
  response.render("about.hbs");
});
//Contact Page
app.get("/contact", function (request, response) {
  response.render("contact.hbs");
});
//Create Work
app.get("/create-work", function (request, response) {
  if (request.session.isLoggedIn == true) {
    response.render("createWork.hbs");
  } else {
    response.render("unauthorized.hbs");
  }
});
app.post("/create-work", function (request, response) {
  const title = request.body.title;
  const link = request.body.link;
  const course = request.body.course;
  const year = request.body.year;
  const inputErrors = [];

  if (title.length == 0) {
    inputErrors.push("Title field can not be empty");
  }
  if (year.length == 0) {
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
        response.redirect("/error");
      } else {
        response.redirect("/works");
      }
    });
  } else {
    const model = {
      inputErrors,
      title,
      link,
      course,
      year,
    };

    response.render("createWork.hbs", model);
  }
});

//Works Page
app.get("/works", function (request, response) {
  const query = "SELECT * FROM works ORDER BY id";
  db.all(query, function (error, works) {
    if (error) {
      response.redirect("/error");
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
      response.redirect("/error");
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

  if (request.session.isLoggedIn == true) {
    db.run(query, id, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/works");
      }
    });
  } else {
    response.redirect("/unauthorized");
  }
});

//Update Work

app.get("/update-work/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM works WHERE id = ?";

  const values = [id];

  if (request.session.isLoggedIn == true) {
    db.get(query, values, function (error, works) {
      if (error) {
        response.redirect("/error");
      } else {
        const model = {
          works,
        };
        response.render("updateWork.hbs", model);
      }
    });
  } else {
    response.redirect("/unauthorized");
  }
});

app.post("/update-work/:id", function (request, response) {
  const id = request.params.id;

  const title = request.body.title;
  const link = request.body.link;
  const course = request.body.course;
  const year = request.body.year;

  const inputErrors = [];
  const notLoggedInError = [];

  if (title.length == 0) {
    inputErrors.push("Title field can not be empty");
  }
  if (year.length == 0) {
    inputErrors.push("Year field can not be empty");
  }

  if (isNaN(year)) {
    inputErrors.push("Year must be a number");
  } else if (year < 0) {
    inputErrors.push("The year can not be negative");
  }

  const query = `UPDATE works SET title = ?, link = ?, course = ?, year = ? WHERE id = ?`;
  const values = [title, link, course, year, id];

  if (inputErrors.length == 0 && request.session.isLoggedIn == true) {
    db.run(query, values, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/works");
      }
    });
  }
  if (!request.session.isLoggedIn) {
    const model = {
      notLoggedInError,
    };
    notLoggedInError.push("You are not logged in");
    response.render("updateWork.hbs", model);
  } else {
    const model = {
      inputErrors,
    };
    response.render("updateWork.hbs", model);
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
    bcrypt.compare(
      enteredPassword,
      hashedadminPassword,
      function (error, passwordIsCorrect) {
        if (error) {
          response.redirect("/error");
        } else {
          if (passwordIsCorrect) {
            request.session.isLoggedIn = true;
            response.redirect("/");
          } else {
            response.redirect("/login");
          }
        }
      }
    );
  } else {
    const model = {
      failedToLogin: true,
    };
    response.render("login.hbs", model);
  }
});

//Review Page

app.get("/reviews", function (request, response) {
  const query = "SELECT * FROM reviews ORDER BY id";
  const inputErrors = [];
  db.all(query, function (error, reviews) {
    if (error) {
      inputErrors.push("Internal error");
      response.redirect("/error");
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
  const reviewInputErrors = [];

  if (name.length == 0) {
    reviewInputErrors.push("Must enter a name");
  }

  if (comment.length == 0) {
    reviewInputErrors.push("Must enter a comment");
  }

  const query = "INSERT INTO reviews (name, comment) VALUES (?, ?)";
  const values = [name, comment];

  if (reviewInputErrors.length == 0) {
    db.run(query, values, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/reviews");
      }
    });
  } else {
    const query = "SELECT * FROM reviews ORDER BY id";
    const values = [name, comment];
    db.all(query, function (error, reviews) {
      if (error) {
        response.redirect("/error");
      } else {
        const model = {
          reviews,
          reviewInputErrors,
          name,
          comment,
        };

        response.render("reviews.hbs", model);
      }
    });
  }
});

app.get("/update-review/:id", function (request, response) {
  const id = request.params.id;
  const notLoggedInError = [];

  const query = "SELECT * FROM reviews WHERE id = ?";

  const values = [id];

  if (request.session.isLoggedIn == true) {
    db.get(query, values, function (error, reviews) {
      if (error) {
        response.redirect("/error");
      } else {
        const model = {
          reviews,
        };
        response.render("updateReview.hbs", model);
      }
    });
  } else {
    response.redirect("/unauthorized");
  }
});

app.post("/update-review/:id", function (request, response) {
  const id = request.params.id;

  const name = request.body.name;
  const comment = request.body.comment;

  const query = `UPDATE reviews SET name = ?, comment = ? WHERE id = ?`;
  const values = [name, comment, id];

  if (request.session.isLoggedIn == true) {
    db.run(query, values, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/reviews");
      }
    });
  } else {
    response.redirect("/unauthorized");
  }
});

app.post("/delete-review/:id", function (request, response) {
  const id = request.params.id;
  const query = `DELETE FROM reviews WHERE id = ?`;

  if (request.session.isLoggedIn == true) {
    db.run(query, id, function (error) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/reviews");
      }
    });
  } else {
    const query = "SELECT * FROM reviews ORDER BY id";
    db.all(query, function (error, reviews) {
      if (error) {
        response.redirect("/error");
      } else {
        response.redirect("/unauthorized");
      }
    });
  }
});

//Error Page (for db errors)

app.get("/error", function (request, response) {
  response.render("error.hbs");
});

//Unauthorized error page
app.get("/unauthorized", function (request, response) {
  response.render("unauthorized.hbs");
});

//Logout
app.get("/logout", function (request, response) {
  response.render("logout.hbs");
});

app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/login");
});

app.listen(8080);
