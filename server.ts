import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client({
  user: "academy",
  password: "",
  host: "localhost",
  port: 5432,
  database: "pastebin",
});
client.connect();

app.get("/", async (req, res) => {
  const dbres = await client.query(
    'SELECT * FROM pastebin');
  res.json(dbres.rows);
});

// Add user input to database
app.post("/input", async (req,res) => {
  try {
    const { title, description } = req.body;
    const newPost = await client.query(
      "INSERT INTO pastebin (post_title, post_desc) VALUES($1, $2)",
    [title, description]);

    res.json(newPost)
  }
  catch(err) {
    console.log(err.message);
  }
});

// See all posts in reverse chronological order
app.get("/viewposts", async (req,res) => {
  try {
    const allPosts = await client.query(
      "SELECT * FROM pastebin ORDER BY post_id DESC");

    res.json(allPosts.rows)
  }
  catch(err){
    console.log(err.message);
  }
});

// Get single post 
app.get("/post/:id", async (req,res) => {
  try {
    const { id } = req.params;
    const post = await client.query(
      "SELECT * FROM pastebin where post_id = $1",
    [id]);

    res.json(post.rows[0]);
    // returns first item for one post
  }
  catch(err) {
    console.log(err.message);
  }
});

// Delete a post 
app.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletePost = await client.query(
      "DELETE FROM pastebin where post_id = $1",
    [id]);

    res.json("Post has been deleted.")
  }
  catch(err){
    console.log(err.message)
  }
});

// Modify and update a post
app.put("/post/:id", async (req, res) => {
  try{
    const { id } = req.params;
    const { title, description } = req.body;
    const updatePost = await client.query(
      "UPDATE pastebin SET post_desc = $1, post_title = $2 WHERE post_id = $3",
        [description, title, id]
    );
    
    res.json("Post was updated.");
  }
  catch(err){
    console.log(err.message)
  }
});

// COMMENTS

// Create new comment specific to a given post
app.post("/post/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const response = await client.query("INSERT INTO comments (post_id, comment_desc) VALUES($1, $2)",
    [id, comment]);
    
    res.status(201).json({
      status: "success",})

  } catch (err) {
    console.log(err.message);
  }
});

// // Get all comments for a specific post
app.get("/post/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const allComments = await client.query(
      "SELECT * FROM comments WHERE post_id = $1", 
      [id]);

    res.json(allComments.rows);
  } catch (err) {
    console.log(err.message);
  }
})

// // Delete a comment of a given id that belongs to a paste
app.delete("/comments/:id", async (req, res) => {
  try {
    // const { id } = req.params;
    const id = req.params.id;
    // console.log(req.params);
    console.log("deleted id is ",id);
    const deletePost = await client.query(
      "DELETE FROM comments where comment_id = $1",
    [id]);

    res.json("Comment has been deleted.")
  }
  catch(err){
    console.log(err.message)
  }
});


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
