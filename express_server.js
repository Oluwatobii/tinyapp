//Creating The Web Server with Express
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

function generateRandomString() {
  let result = Math.random().toString(36).substring(2, 8);
  return result;
}

const addNewUser = (email, password) => {
  // generate an id
  const userId = generateRandomString();
  // create a new user object
  const newUser = {
    id: userId,
    email,
    password,
  };
  users[userId] = newUser;

  return userId;
};

const findTheUserByEmail = (email) => {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return false;
};

const authenticateUser = (email, password) => {
  // Does the user with that email exist?
  const user = findTheUserByEmail(email);

  // check the email and passord match
  if (user.email === email && user.password === password) {
    return user.id;
  } else {
    return false;
  }
};

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = newLongURL;
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  let newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = newLongURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.get("/login", (req, res) => {
  const templateVars = { email: "" };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  // Extract the user info from the request body
  const { email, password } = req.body;

  // Authenticating the user
  const userId = authenticateUser(email, password);

  if (userId) {
    // set the user id in the cookie
    res.cookie("user_id", userId);
    // res.redirect /urls
    res.redirect("/urls");
  } else {
    res.status(403).send("Error!");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`);
});

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlDatabase,
      email: users[req.cookies.user_id].email,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlDatabase,
      email: users[req.cookies.user_id].email,
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { email: "" };

  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  //console.log("REQ.BODY===>", req.body);
  const { email, password } = req.body;
  if (email === "" || password === "") {
    res.status(400).send("Email & Password needs to be filled out!");
  }

  //console.log("USERS===>", users);
  const userExistInDb = findTheUserByEmail(email);

  if (userExistInDb) {
    res.status(400).send("Error: email already exists");
  } else {
    const userId = addNewUser(email, password);
    //console.log("USERS===>", users);

    res.cookie("user_id", userId);
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  console.log(req.cookies);
  const templateVars = {
    email: users[req.cookies.user_id].email,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
