//Creating The Web Server with Express

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieSession = require("cookie-session");

const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

//Functions required

const {
  generateRandomString,
  urlsForUser,
  findTheUserByEmail,
  addNewUser,
  authenticateUser,
} = require("./helpers");

//Constants(varibles) required

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", saltRounds),
  },
};

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
};

//Creating Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  const userID = req.session.user_id;
  urlDatabase[newShortURL] = { longURL: newLongURL, userId: userID };
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userId === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  }
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (urlDatabase[req.params.shortURL].userId === req.session.user_id) {
    let newLongURL = req.body.longURL;
    urlDatabase[req.params.shortURL].longURL = newLongURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { email: "" };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  // Extract the user info from the request body
  const { email, password } = req.body;

  // Authenticating the user
  const user = authenticateUser(users, email, password);

  if (user) {
    // set the user id in the cookie
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Error!! - Wrong Credentials");
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect(`/urls`);
});

app.get("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else {
    const newDatabase = urlsForUser(urlDatabase, req.session.user_id);
    const templateVars = {
      urls: newDatabase,
      email: users[req.session.user_id].email,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else {
    const newDatabase = urlsForUser(
      urlDatabase,
      users[req.session.user_id].user_id
    );
    const templateVars = {
      urls: newDatabase,
      email: users[req.session.user_id].email,
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { email: "" };

  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    res.status(400).send("Email & Password needs to be filled out!");
  }

  const userExistInDb = findTheUserByEmail(email);

  if (userExistInDb) {
    res.status(400).send("Error: email already exists");
  } else {
    const userId = addNewUser(users, email, password);

    req.session.user_id = userId;
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const newDatabase = urlsForUser(urlDatabase, req.session.user_id);
  const templateVars = {
    email: users[req.session.user_id].email,
    shortURL: req.params.shortURL,
    longURL: newDatabase[req.params.shortURL].longURL,
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
