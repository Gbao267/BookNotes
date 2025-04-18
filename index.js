import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "533123",
  port: 5432,
});

const app = express();
const port = 3000;

db.connect();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let books = [];

//FUNCTION GET BOOK FROM SQL
async function getBook() {
  try {
    const result = db.query("SELECT * FROM Books");
    let books = (await result).rows;
    return books;
  } catch (error) {
    console.log("co loi getBook");
  }
}

//FUNCTION GET BOOK FROM SQL
async function getBookByColumn(column) {
  try {
    let result;
    switch (column) {
      case "rating":
        result = db.query("SELECT * FROM books ORDER BY rating ASC ");
        break;
      case "recently":
        result = db.query("SELECT * FROM books ORDER BY date_read ASC ");
        break;
      case "name":
        result = db.query("SELECT * FROM books ORDER BY name ASC ");
        break;
    }
    let books = (await result).rows;
    return books;
  } catch (error) {
    console.log("co loi getBookByColumn");
  }
}

//FUNCTION GET COVER ID FROM OPEN LIBRARY TO USE IN INDEX.EJS
async function getCover_i(name) {
  try {
    const response = await axios.get(`https://openlibrary.org/search.json?title=${name}`);
    const result = response.data;
    console.log(result.docs[0].cover_i);
    const cover_i = result.docs[0].cover_i;
    return cover_i;
  } catch (error) {
    console.log("co loi getCover_i");
  }
}

// HOMEPAGE
app.get("/", async (req, res) => {
  const books = await getBook();
  console.log(books);
  res.render("index.ejs", { books: books });
});

//SORTED HOMEPAGE
app.post("/option", async (req, res) => {
  const column = req.body.options;
  console.log(column);
  const books = await getBookByColumn(column);
  console.log(books);
  res.render("index.ejs", { books: books });
});

// ADD BOOK PAGE
app.get("/add", (req, res) => {
  res.render("modify.ejs", {
    heading: "New Book",
  });
});

// ADD BOOK METHOD
app.post("/new-book", async (req, res) => {
  const name = req.body.name;
  const cover_i = await getCover_i(name);
  const intro = req.body.name;
  const rating = 0;
  try {
    await db.query("INSERT INTO books(cover_i, name, introduction, rating, date_read) VALUES ($1,$2,$3,$4,CURRENT_DATE)", [
      cover_i,
      name,
      intro,
      rating,
    ]);
    res.redirect("/");
  } catch (error) {
    console.log("loi");
  }
});

// EDIT BOOK PAGE
app.post("/edit", async (req, res) => {
  const id = req.body.id;
  const books = await getBook();
  const book = books.find((book) => book.id === parseInt(id));
  console.log(book);
  res.render("modify.ejs", {
    heading: "Edit",
    book: book,
  });
});

// EDIT BOOK METHOD
app.post("/update", async (req, res) => {
  const id = req.body.id;
  const name = req.body.name;
  const rating = req.body.rating;
  const intro = req.body.intro;
  try {
    await db.query("UPDATE books SET name = $1, introduction = $2, rating = $3 WHERE id = $4", [name, intro, rating, id]);
    res.redirect("/");
  } catch (error) {
    console.log("co loi update");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
