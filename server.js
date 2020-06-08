 var port_number = 3000;
 if(process.env.PORT){
     port_number = process.env.PORT;
 }

//diffrent categories on the site
var pages = [];

//importing mongodb values from environment variables
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDBName = process.env.MONGO_DB_NAME; 
const mongoURL =
	'mongodb://' + mongoUser + ':' + mongoPassword + '@' +
  mongoHost + ':' + mongoPort + '/' + mongoDBName;

//setting up server 
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const app = express();
const port = port_number;
var mongoDBDatabase;

app.engine('handlebars', exphbs({defaultLayout: 'main' })); 
app.set('view engine', 'handlebars');
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public/img"));

app.get('/', function(req, res, next){
  res.status(200).render(page, {
    posts: 'all posts from mongo DB'
  });
});

//serve a page with many posts
app.get('/:page', function(req, res, next){
  var page = req.params.page;
  var pagesDB = db.collection('pages');
  //console.log(pages);
  var pagesCursor = pagesDB.find({});
  //console.log(pagesCursor);
  pagesCursor.toArray(function (err, pageDocs){
    if(err) {
      res.status(500).send("Error fetching pages from DB")
    } else {
      console.log(pageDocs);
      if(pageDocs.some( e => e.page === page)){
        res.status(200).sendFile(__dirname + "/public/index.html");
        /*
        res.status(200).render(page, {
          posts: 'page\'s posts from mongo DB'
        });
        */
      } else {
        next();
      }
    }
  })
});

//serve a specific post's page with comments
app.get('/:page/:postID', function(req, res, next){
  console.log("requested post page");
  var page = req.params.page;
  var postID = req.params.postID;
  var post_OID = new ObjectID(postID);
  var postDB = db.collection('posts');
  var postCursor = postDB.find({_id: post_OID});

  if(pages.includes(page)){

    postCursor.toArray(function (err, postDocs){
      console.log(postDocs);

      if(err) {
        res.status(500).send("Error fetching pages from DB")
      } else {
          if(postDocs){
            res.status(200).sendFile(__dirname + "/public/index.html");
            /*
            res.status(200).render(postPage, {
              post: post
            });
            */
          } else {
            console.log("couldn't find post in DB")
            next();
          }
      }
    });
  } else {
    console.log("couldn't find page" + page + " in DB")
    next();
  }
});

//serve 404 page
app.get('*', function(req, res, next) {
    res.status(404).sendFile(__dirname + "/public/404.html");
});

//api route for addding a post
app.post('/:page/addPost', function (req, res){
  if (req.body && req.body.title && req.body.text && req.body.author && req.params.page in pages) {

    // Add post to DB here.

    res.status(200).send("Post added");
  } else {
    res.status(400).send("Requests to this path must " +
      "contain a JSON body with title, text, and author " +
      "fields.");
  }
});

//api route for addding a comment 
app.post('/:page/:postID/addComment', function (req, res){
  if (req.body && req.body.text && req.body.author && req.params.page in pages) {

    // Add comment to DB here.

    res.status(200).send("Comment added");
  } else {
    res.status(400).send("Requests to this path must " +
      "contain a JSON body with a text and author " +
      "fields.");
  }
});


MongoClient.connect(mongoURL, function (err, client) {
  if(err) {
    throw err;
  }
  db = mongoDBDatabase = client.db(mongoDBName);
  var pagesDB = db.collection('pages');
  var pagesCursor = pagesDB.find({});
  pagesCursor.toArray(function (err, pageDocs){
    for (i = 0; i < Object.keys(pageDocs).length; i++ ){
      pages.push(pageDocs[i].page);
    }
    app.listen(port, () => console.log("listening on port " + port));
  });
});
