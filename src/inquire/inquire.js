const inquirer = require('inquirer');
const mongoose = require('mongoose');
const Post = require('../auth/schema-models/post');
const chalkAnimation = require('chalk-animation');
const chalk = require('chalk');
require('dotenv').config();
const blogPostSchema = new mongoose.Schema({
  title: String,
  body: String,
});

function startServer() {
  mongoose.connect(process.env.MONGODB_URL);

  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'Connection error'));
  db.once('open', () => console.log('Mongoose is connected'));
}

function signIn() {
  inquirer
    .prompt([
      {
        name: 'user_name',
        type: 'input',
        message: 'What is your name?',
      },
    ])

    .then(async (answer) => {
      const greetingAnimation = chalkAnimation.rainbow(`Hello ${answer.user_name}. What would you like to do?`);
      await wait(1500);

      greetingAnimation.stop();
      baseMenu();
    });
}

const BlogPosts = mongoose.model('BlogPost', blogPostSchema);

function createBlogPost() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'blog_title',
        message: 'What is the name of your blog?',
      },
      {
        type: 'input',
        name: 'blog_author',
        message: 'Name of Author?',
      },
      {
        type: 'input',
        name: 'blog_body',
        message: 'What is your blog about?',
      },
    ])
    .then(async (answer) => {
      if (!answer.blog_body || !answer.blog_title) {
        return;
      }
      try {
        const blogPost = new Post({
          title: answer.blog_title,
          body: answer.blog_body,
          id: 100,
          status: true,
          author: answer.blog_author,
          keyWord: [],
          likes: 1000,
          comments: [],
        });
        blogPost
          .save()
          .then((result) =>
            console.log(`Blog post ${result.title} was added successfully`)
          );
        await wait(1500);
        baseMenu();
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
        choices: [
          'Create a post',
          'Read a post',
          'Delete post',
          'Edit post',
        ],
      },
    ])

    .then((answer) => {
      if (answer.menu === 'Create a post') {
        createBlogPost();
      }
      if (answer.menu === 'Read a post') {
        viewByTitleOrAuthor();
      }
      if (answer.menu === 'Delete post') {
        deleteBlogPost();
      }
      if (answer.menu === 'Edit post') {
        editBlogPost();
      }
    });
}


function viewByTitle() {
  Post.find()
    .exec()
    .then((posts) => {
      const postTitles = posts.map((post) => post.title);

      const blogPosts = {
        type: 'list',
        name: 'selectedPost',
        message: 'Select a post',
        choices: postTitles,
      };

      inquirer
        .prompt([blogPosts])
        .then(async (answers) => {
          const selectedPost = answers.selectedPost;
          console.log(chalk.bold.blueBright(`You selected: ${selectedPost}`));
          Post.findOne({ title: selectedPost }).then((result) => {
            console.log(result.body);
            console.log(chalk.bold.greenBright('Author:', result.author));
            viewBlogPost();
          });


        })
        .catch((error) => {
          console.error('Error fetching data', error);
        });
    })
    .catch((error) => {
      console.error('Error fetching post titles', error);
    });
}


function viewByAuthor() {
  Post.find()
    .exec()
    .then((posts) => {
      const postAuthors = posts.map((post) => post.author) || 'nothing available';
      const blogPosts = {
        type: 'list',
        name: 'selectedAuthor',
        message: 'Select a post',
        choices: postAuthors,
      };

      return inquirer.prompt([blogPosts]);
    })
    .then(async (answers) => {

      const selectedPost = answers.selectedAuthor;

      Post.findOne({ author: selectedPost }).then((result) => {
        console.log(chalk.bold.greenBright('Author:', result.author));
        console.log(chalk.bold.blueBright('Title:', result.title));
        console.log(result.body);
        viewBlogPost();
      });
    })

    .catch((error) => {
      console.error('Error fetching data', error);
    });
}

function viewBlogPost() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Like this post',
          'Add a comment',
          'Go back to the main menu',

        ],
      },

    ])
    .then(async (answer) => {
      if (answer.action === 'Like this post') {
        await Post.updateOne(
          { title: answer.selectedPost },
          { $inc: { likes: 1 } }
        );
        console.log(chalk.bold.magentaBright('You liked this post!'));
      } else if (answer.action === 'Add a comment') {
        const commentAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'comment',
            message: 'Enter your comment:',
          },
        ]);
        await Post.updateOne(
          { title: answer.selectedPost },
          { $push: { comments: commentAnswer.comment } }
        );
        console.log('Your comment has been added!');
      }

      await wait(1500);
      baseMenu();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function deleteBlogPost() {
  Post.find({}, 'title')
    .exec()
    .then((posts) => {
      const postTitles = posts.map((post) => post.title);
      inquirer
        .prompt([
          {
            type: 'checkbox',
            name: 'post_title',
            message: 'Select a post to delete:',
            choices: ['Return to main menu', ...postTitles],
          },
        ])
        .then(async (answer) => {
          // log(chalk.blue.bgRed.bold('Hello world!'));
          if (answer.post_title === 'Return to main menu') {
            baseMenu();
          }
          try {
            const postToDelete = await Post.findOneAndDelete({
              title: answer.post_title,
            });
            if (postToDelete) {
              console.log(`Post '${postToDelete.title}' has been deleted.`);
            } else {
              console.log(`No post found with title '${answer.post_title}'.`);
            }
            await wait(1500);
            baseMenu();
          } catch (e) {
            console.error('Error:', e);
          }
        });
    })
    .catch((error) => {
      console.error('Error fetching post titles', error);
    });
}

function editBlogPost() {

  Post.find()
    .exec()
    .then((posts) => {
      const editPost = posts.map((post) => post.title || 'no title available');
      inquirer
        .prompt([
          {
            type: 'list',
            name: 'post_title',
            message: 'Select a post to edit:',
            choices: ['Return to main menu', ...editPost],
          },
        ])
        .then(async (answer) => {
          try {
            if (answer.post_title === 'Return to main menu') {
              baseMenu();
              console.log(chalk.bold.redBright('Return to main menu'));
            }
            const selectedTitle = answer.post_title;
            const selectedPost = await Post.findOne({
              title: selectedTitle,
            });

            if (!selectedPost) {
              console.log(`No post found with title '${selectedTitle}'.`);
              await wait(1500);
              baseMenu();
              return;
            }

            const editAnswers = await inquirer.prompt([
              {
                type: 'input',
                name: 'editedBody',
                message: 'Edit the post body:',
                default: selectedPost.body,
              },
            ]);
            selectedPost.body = editAnswers.editedBody;

            await selectedPost.save();
            console.log(`Post '${selectedTitle}' has been edited.`);
            await wait(1500);
            baseMenu();
          } catch (e) {
            console.error('Error:', e);
          }
        });
    })
    .catch((error) => {
      console.error('Error fetching post titles', error);
    });
}


function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function viewByTitleOrAuthor() {
  inquirer
    .prompt([
      {
        name: 'menu',
        type: 'list',
        message: 'Would you like to view by Title or Author?',
        choices: [
          'View by Title',
          'View by Author',
        ],
      },
    ])

    .then((answer) => {
      if (answer.menu === 'View by Title') {
        viewByTitle();
      }
      if (answer.menu === 'View by Author') {
        viewByAuthor();
      }

    });
}

async function startWait() {
  startServer();
  await wait(1500);
  signIn();
}

startWait();

module.exports = {
  editBlogPost
};