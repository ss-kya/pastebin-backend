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

const client = new Client(dbConfig);
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
      "INSERT INTO pastebin (post_title)(post_desc) VALUES($1)($2)",
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
app.delete("post/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
app.put("post/:id", async (req, res) => {
  try{
    const { id } = req.params;
    const { description } = req.body;
    const updatePost = await client.query(
      "UPDATE pastebin SET post_desc = $1 WHERE post_id = $2",
    [description, id]);

    res.json("Post was updated.");
  }
  catch(err){
    console.log(err.message)
  }
});

//Start the server on the given port
const port = process.env.PORT ?? 4000;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
