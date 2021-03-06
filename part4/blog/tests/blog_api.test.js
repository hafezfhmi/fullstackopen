const supertest = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Blog = require('../models/blog');
const User = require('../models/user');

const api = supertest(app);

const initialBlog = [
  { title: 'Duckie duck', author: 'Duckie', url: 'duckie.com', likes: 2 },
  { title: 'Doggie dog', author: 'Doggie', url: 'doggie.com', likes: 5 },
];

let userWithToken;

beforeEach(async () => {
  // Delete user
  await User.deleteMany({});

  // Create a new user and get password hash
  const createdUser = await api
    .post('/api/users')
    .send({ username: 'Jone', name: 'Jone', password: 'abc123' });

  const createdUserWithId = await User.findById(createdUser.body.id);

  // Get token of the created user
  userWithToken = await api.post('/api/login').send({
    username: createdUser.body.username,
    password: 'abc123',
  });
  userWithToken = userWithToken.body;

  // Delete blog
  await Blog.deleteMany({});

  // Create blog
  for (const iterator of initialBlog) {
    // Create user field of the user

    iterator.user = createdUserWithId._id;
    let blogObject = new Blog(iterator);
    await blogObject.save();
  }
});

test('Returns correct amount of blog post', async () => {
  const returnedBlog = await api.get('/api/blogs');

  expect(returnedBlog.body).toHaveLength(initialBlog.length);
});

test('id is defined in one of the object', async () => {
  const returnedBlog = await api.get('/api/blogs');

  expect(returnedBlog.body[0].id).toBeDefined();
});

test('Likes is default to 0', async () => {
  const noLikeBlog = new Blog({
    title: 'Meowie meow',
    author: 'Meowie',
    url: 'meowie.com',
  });

  await noLikeBlog.save();

  const returnedBlog = await api.get('/api/blogs');
  const lastBlog = returnedBlog.body[returnedBlog.body.length - 1];

  expect(lastBlog.likes).toBe(0);
});

test('Bad request if title and url is missing', async () => {
  const nonCompletedBlog = new Blog({ author: 'Roofie', likes: 2 });

  await api
    .post('/api/blogs')
    .send(nonCompletedBlog)
    .set('Authorization', `Bearer ${userWithToken.token}`)
    .expect(400);
}, 100000);

test('Removing an item', async () => {
  // Get blogs from db
  const currentBlogs = await api.get('/api/blogs');

  // Get blogs to delete
  const blogToDelete = currentBlogs.body[0];

  // Delete
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${userWithToken.token}`)
    .expect(204);

  // Get blogs after delete
  const noteAtEnd = await api.get('/api/blogs');

  // Check blogs after delete length
  expect(noteAtEnd.body).toHaveLength(initialBlog.length - 1);

  // Get content of blogs after delete
  const blogIdList = noteAtEnd.body.map((curr) => curr.id);

  // Make sure deleted content is not in db
  expect(blogIdList).not.toContain(blogToDelete.id);
});

test('Updating blog', async () => {
  // Get blogs from db
  const currentBlogs = await api.get('/api/blogs');

  // Get blogs to update
  const blogToUpdate = currentBlogs.body[0];

  let updatedBlog = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send({ likes: blogToUpdate.likes + 1 });

  updatedBlog = updatedBlog.body;

  expect(updatedBlog.likes).not.toBe(blogToUpdate.likes);
  expect(updatedBlog.likes).toBe(blogToUpdate.likes + 1);
});

afterAll(() => {
  mongoose.connection.close();
});
