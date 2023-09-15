const inquirer = require('inquirer');
const mongoose = require('mongoose');
const Post = require('../auth/schema-models/post');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error'));
db.once('open', () => console.log('Mongoose is connected'));

function signIn() {
  inquirer
    .prompt([
      {
        name: 'user_name',
        type: 'input',
        message: 'What is your name?',
      },
    ])

    .then((answer) => {
      console.log(`Hello ${answer.user_name}. What would you like to do?`);

      baseMenu();
      createBlog();
    });
}
function createBlog() {
  inquirer
    .prompt([
      {
        type: 'editor',
        name: 'blog_post',
        message: 'What is your blog about?',
      },
    ])
    .then((answer) => {
      try {
        const blogPost = new Post({
          title: 'tester',
          body: answer.blog_post,
          id: 100,
          status: true,
          userId: 100,
          keyWord: ['buffalo'],
          likes: 1000,
          comments: [],
        });
        // const newAnswer = new Post({ body: answer.blog_post });
        blogPost.save().then((result) => console.log(result));
        console.info('Answer:', answer.blog_post);
      } catch (e) {
        console.log(e);
      }
    });
}

function baseMenu() {
  inquirer
    .prompt([
      {
        name: 'menu',
        type: 'list',
        message: 'Welcome! Please pick an option. . .',
        choices: ['create a post', 'read somthing'],
      },
    ])

    .then((answer) => {
      console.log(answer.menu);
      // if (menu.choices[0]) {

      // }
      // if (menu.choices[1]) {
      // readPostedBlog();
      // }
    });
}

function selectPostedBlog() {
  const blogPosts = [];

  Post.find({}, { maxTimeMS: 20000 })
    .exec()
    .then((posts) => {
      posts.forEach((post) => {
        blogPosts.push({
          type: 'list',
          name: 'selectedPost',
          message: 'Select a post',
          choices: posts.map((post) => post.title),
        });
        console.log('========', posts.title);
      });
      return inquirer.prompt(blogPosts);
    })
    .then((answers) => {
      const selectedPost = answers.selectedPost;
      console.log(`You selected: ${selectedPost}`);
    })
    .catch((error) => {
      console.error('Error fetching data', error);
    });
}

signIn();