import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

///DB///
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "533123",
  port: 5432,
});
db.connect();

//SETUP//
const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//ENVIRONMENT VARIABLE
let books = [];

///////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////----FUNCTION----//////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
//GET COVER ID
async function getCover_i(name) {
  try {
    const response = await axios.get(`https://openlibrary.org/search.json?title=${name}`);
    const result = response.data;
    const cover_i = result.docs[0].cover_i;
    return cover_i;
  } catch (error) {
    console.log("co loi getCover_i");
  }
}
//GET BOOKS
async function getBooks() {
  try {
    const result = await db.query("SELECT * FROM Books ORDER BY id ASC");
    let books = result.rows;
    return books;
  } catch (error) {
    console.log("co loi getBooks");
  }
}
//GET BOOKS BY COLUMN
async function getBooksByColumn(column) {
  try {
    let result;
    switch (column) {
      case "rating":
        result = await db.query("SELECT * FROM books ORDER BY rating ASC ");
        break;
      case "recently":
        result = await db.query("SELECT * FROM books ORDER BY date_read ASC ");
        break;
      case "name":
        result = await db.query("SELECT * FROM books ORDER BY name ASC ");
        break;
    }
    let books = result.rows;
    return books;
  } catch (error) {
    console.log("co loi getBooksByColumn");
  }
}
//GET BOOK BY ID
async function getBookByID(id) {
  const books = await getBooks();
  const book = books.find((book) => book.id === parseInt(id));
  return book;
}
//GET NOTES BY BOOK
async function getNotesOfBook(id) {
  try {
    const result = await db.query("SELECT * FROM notes WHERE book_id = $1 ORDER BY id ASC", [id]);
    let notes = result.rows;
    return notes;
  } catch (error) {
    console.log("co loi getNotes");
  }
}
//ADD NOTE BY BOOK
async function addNote(note, id) {
  try {
    await db.query("INSERT INTO notes(note,book_id) VALUES ($1,$2)", [note, id]);
    console.log("addNote thanh cong");
  } catch (error) {
    console.log("co loi addNote");
  }
}

//EDIT NOTE BY NOTE
async function editNote(note, id) {
  try {
    await db.query("UPDATE notes SET note = $1 WHERE id = $2", [note, id]);
    console.log("editNote thanh cong");
  } catch (error) {
    console.log("co loi editNote");
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// localhost:3000 <--------- THIS IS URL
// HOMEPAGE
app.get("/", async (req, res) => {
  const books = await getBooks();
  res.render("index.ejs", { books: books });
});
// SORTED HOMEPAGE
app.post("/option", async (req, res) => {
  const column = req.body.options;
  const books = await getBooksByColumn(column);
  res.render("index.ejs", { books: books });
});
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// localhost:3000/detail  <--------- THIS IS URL
// BOOK DETAILS
app.get("/detail/:id", async (req, res) => {
  const id = req.params.id;
  const book = await getBookByID(id);
  console.log(book);
  const notes = await getNotesOfBook(id);
  res.render("detail.ejs", { book: book, notes: notes });
});
// ADD NOTE
app.post("/add-note", async (req, res) => {
  const id = req.body.id;
  const note = req.body.newNote;
  await addNote(note, id);
  res.redirect("/detail/" + id);
});
// EDIT NOTE
app.post("/edit-note", async (req, res) => {
  const book_id = req.body.BookId;
  const id = req.body.id;
  const note = req.body.NoteTitle;
  await editNote(note, id);
  res.redirect("/detail/" + book_id);
});
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// localhost:3000/add  <--------- THIS IS URL
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
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// localhost:3000/edit  <--------- THIS IS URL
// EDIT BOOK PAGE
app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const book = await getBookByID(id);
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
///////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
///////////////////////////////////////////////////////////////////////////////////////////////////
