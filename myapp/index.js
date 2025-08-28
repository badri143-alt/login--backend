const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const cors = require('cors') // Import CORS

const app = express()
app.use(cors()) // Enable CORS for all routes
app.use(express.json())

const dbPath = path.join(__dirname, 'goodreads.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `SELECT * FROM book ORDER BY book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

// Register API
app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES ('${username}', '${name}', '${hashedpassword}', '${gender}', '${location}');
    `
    await db.run(createUserQuery)
    response.send('created successfully')
  } else {
    response.status(400)
    response.send('user already exists')
  }
})

// Login API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('login successful')
    } else {
      response.status(400)
      response.send('invalid Password')
    }
  }
})
