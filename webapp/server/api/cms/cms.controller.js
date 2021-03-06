'use strict';

var _ = require('lodash');
var mongo = require('mongodb').MongoClient;
var path = require('path');
var fs = require('fs');
var os = require('os');
var http = require('http');
var inspect = require('util').inspect;
var Busboy = require('busboy');
var password = 'Decor$tore15'; // change this on production!
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();
var db;

mongo.connect('mongodb://localhost/cms', function(err, database) {
  if (!err) {
    console.log('DB: connected to db');
    db = database;
    database.createCollection('data', { strict: true }, function(err, collection) {
      if (!err) {
        var data_doc = { name: 'data', 'Capabilities': [], 'Products': [] }
        collection.insert(data_doc);
      }
    });
  }
});

// returns object containing data for all images
exports.get_images = function(req, res) {
  db.collection('images').find({}, {filename:'true'}).toArray(function(err, results) {
    var files = [];
    for (var i = 0; i < results.length; i++) {
      files.push(results[i].filename);
    }
    res.send(files);
  });
};

exports.get_images_tags = function(req, res) {
  var tags = { Capabilities: [], Products: [], Flags: [] };
  db.collection('images').findOne({filename:req.query.name}, function(err, doc) {
    tags.Capabilities = doc.Capabilities;
    tags.Products = doc.Products;
    tags.Flags = doc.Flags;
    console.log(tags);
    res.send(tags);
  });
};

exports.get_images_website = function(req, res) {
  var website_obj = {capas: [], prods: [], imgs: []};
  db.collection('images').find({}, {filename:'true', Capabilities:'true', Products:'true', Flags:'true'}).toArray(function(err, results) {
    website_obj.imgs = results;
    db.collection('data').findOne({name:'data'}, function(err, doc) {
      website_obj.capas = doc.Capabilities;
      website_obj.prods = doc.Products;
      res.send(website_obj);
    });
  });
};

// upload a file
exports.post_images = function(req, res) {
  if (req.method === 'POST') {
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      var saveTo = path.join(__dirname + '../../../../client/assets/images/uploads/'
        + path.basename(filename));
      file.pipe(fs.createWriteStream(saveTo));
      var img_doc = { filename: path.basename(filename), 'Capabilities': [],
        'Products': [], 'Flags': [] };
      db.collection('images').insert(img_doc);
    });
    busboy.on('finish', function() {
      res.redirect("back");
    });
    return req.pipe(busboy);
  }
  res.writeHead(404);
  res.end();
};

// all-purpose data updating function (not lazy api design, I swear!)
exports.put_images = function(req, res) {
  if (req.query.password === password) {
    if (req.query.operation == 1) {
      if (req.query.category === 'capa') {
        db.collection('images').update(
          { filename: req.query.file, },
          { $addToSet: { Capabilities: req.query.name }}
        );
      }
      else if (req.query.category === 'prod')
      {
        db.collection('images').update(
          { filename: req.query.file, },
          { $addToSet: { Products: req.query.name }}
        );
      }
      else if (req.query.category === 'flag')
      {
        db.collection('images').update(
          { filename: req.query.file, },
          { $addToSet: { Flags: req.query.name }}
        );
      }
    }
    else if (req.query.operation == 0) {
      if (req.query.category === 'capa') {
        db.collection('images').update(
          { filename: req.query.file, },
          { $pull: { Capabilities: req.query.name }}
        );
      }
      else if (req.query.category === 'prod')
      {
        db.collection('images').update(
          { filename: req.query.file, },
          { $pull: { Products: req.query.name }}
        );
      }
      else if (req.query.category === 'flag')
      {
        db.collection('images').update(
          { filename: req.query.file, },
          { $pull: { Flags: req.query.name }}
        );
      }
    }
  }
};

// deletes an image
exports.delete_images = function(req, res) {
  if (req.query.password === password) {
    var exists = true;
    fs.open(__dirname + '/../../../client/assets/images/uploads/' + req.query.filename, 'r',
      function(err, fd) {
        if (err && err.code == 'ENOENT')
        {
          return;
        }
        else {
          fs.unlink(__dirname + '/../../../client/assets/images/uploads/' + req.query.filename);
          db.collection('images').remove({filename: req.query.filename});
        }
        res.send(200);
      }
    );
  }
};

// returns JSON array of Capabilities
exports.get_capa = function(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  db.collection('data').findOne({name:'data'}, function(err, doc) {
    var json = JSON.stringify(doc.Capabilities);
    res.end(json);
  });
};

// add a capability
exports.post_capa = function(req, res) {
  if (req.query.password === password) {
    db.collection('data').update(
      { name: 'data', },
      { $addToSet: { Capabilities: req.query.category }}
    );
    res.send(200);
  }
};

// deletes a capability alltogether
exports.delete_capa = function(req, res) {
  if (req.query.password === password) {
    db.collection('data').update(
      { name: 'data', },
      { $pull: { Capabilities: req.query.category }}
    );
    res.send(200);
  }
};

// returns JSON array of Products
exports.get_prod = function(req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  db.collection('data').findOne({name:'data'}, function(err, doc) {
    var json = JSON.stringify(doc.Products);
    res.end(json);
  });
};

// add a product
exports.post_prod = function(req, res) {
  if (req.query.password === password) {
    db.collection('data').update(
      { name: 'data', },
      { $addToSet: { Products: req.query.category }}
    );
    res.send(200);
  }
};

// deletes a product alltogether
exports.delete_prod = function(req, res) {
  if (req.query.password === password) {
    db.collection('data').update(
      { name: 'data', },
      { $pull: { Products: req.query.category }}
    );
    res.send(200);
  }
};

exports.post_email = function(req, res) {
  var text_string = 'someone filled out the contact for at: '
	      + getDateTime() + '\n'
              + 'name: ' + req.query.name + '\n'
              + 'company: ' + req.query.company + '\n'
              + 'phone: ' + req.query.phone + '\n'
              + 'e-mail: ' + req.query.email + '\n'
              + 'city: ' + req.query.city + '\n'
              + 'state: ' + req.query.state + '\n'
              + 'info: \n\n' + req.query.info + '\n';
  transporter.sendMail({
    from: 'website@TheStoreDecor.com',
    to: 'vision@thestoredecor.com',
    subject: 'Contact Us Form Submission',
    text: text_string
  });
  res.send(200);
};

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}
