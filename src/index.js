const express = require('express');
const cors = require('cors');
const { v4 } = require('uuid');

// const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const userExists = users.find(user => user.username === username)

  if (!userExists) {
    return response.status(400).json('not authorized')
  }

  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userExists = users.find(user => user.username === username)

  if (userExists) {
    return response.status(400).json({ error: 'username already taken' })
  }

  const user = {
    name, username, id: v4(), todos: []
  }

  users.push(user)

  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers
  const userIndex = users.findIndex(user => user.username === username)
  const user = users[userIndex]

  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers
  const { title, deadline } = request.body

  const userIndex = users.findIndex(user => user.username === username)

  const newTodo = { id: v4(), created_at: new Date(), title, deadline, done: false }

  const user = users[userIndex]
  user.todos.push(newTodo)

  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { id } = request.params
  const { username } = request.headers

  const userIndex = users.findIndex(user => user.username === username)
  const user = users[userIndex]

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'todo not existent' })
  }
  const todo = user.todos[todoIndex]

  const updatedTodo = { ...todo, title, deadline }

  const todos = user.todos

  todos[todoIndex] = updatedTodo

  user.todos = todos

  users[userIndex] = user

  return response.json(updatedTodo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request.headers
  const userIndex = users.findIndex(user => user.username === username)
  const user = users[userIndex]

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'todo not existent' })
  }

  users[userIndex].todos[todoIndex].done = true

  return response.json(users[userIndex].todos[todoIndex])
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request.headers
  const userIndex = users.findIndex(user => user.username === username)


  const todoIndex = users[userIndex].todos.findIndex(todo => todo.id === id)

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'no such todo with this id' })
  }

  users[userIndex].todos.splice(todoIndex,1)

  return response.status(204).send()
});

module.exports = app;