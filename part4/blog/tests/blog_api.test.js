const supertest = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Blog = require('../models/blog');

const api = supertest(app);

const initialBlog = [
  { title: 'Duckie duck', author: 'Duckie', url: 'duckie.com', likes: 2 },
  { title: 'Doggie dog', author: 'Doggie', url: 'doggie.com', likes: 5 },
];

beforeEach(async () => {
  await Blog.deleteMany({});
  for (const iterator of initialBlog) {
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

  await api.post('/api/blogs').send(nonCompletedBlog).expect(400);
}, 100000);

afterAll(() => {
  mongoose.connection.close();
});
