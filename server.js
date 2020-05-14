var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var cron = require('node-cron');
var app = express();
let jsonData = require('./scrap.json')
const mysql = require('mysql');
const dbConfig = require("./db.config.js");
var bodyParser = require('body-parser');
{/* <meta http-equiv="refresh" content="30"/> */ }

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


const con = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DATABASE
});

con.connect((err) => {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
});

app.get('/', function (req, res) {
    url = 'https://coincap.io/';
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var jsonarry = [];
            // third
            var sql = 'TRUNCATE TABLE coinData;';
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("deleted 3rd", result);
            });
            cron.schedule('*/10 * * * * *', () => {
                console.log("called");
                jsonarry = [];
                $("#__next > main > div.ui.attached.padded.segment.table-segment > div > table > tbody > tr").each((index, element) => {
                    var rank = $(element).find('td.center.aligned').text();
                    var title = $(element).find('td > div > a').text();
                    var short_name = $(element).find('td > div > a > p').text();
                    var img = $(element).find('td.left.aligned > img').attr('src');
                    var price = $(element).find('td > span.numeral.Numeral__Container-sc-18j7kzw-0.hjgoAp').text();
                    var mCap = $(element).find('td > span.numeral.Numeral__Container-sc-18j7kzw-0.hjgoAp').text();
                    jsonarry.push({
                        rank: rank,
                        short_name: short_name,
                        title: title !== "" ? title.split(short_name)[0] : short_name,
                        img_url: img,
                        price: price.split("$")[1],
                        mCap: mCap.split("$")[2],
                    });
                });
                console.log("shubhu", jsonarry);
                fs.writeFile('scrap.json', JSON.stringify(jsonarry, null, 4), function (err) {
                    console.log("File written");
                });
            });

            // First
            fs.readFile('scrap.json', 'utf-8', (err, data) => {
                console.log("Reading: 1st");
                if (err) throw err;
                jsonData = JSON.parse(data);
                jsonData.forEach(element => {
                    // second
                    console.log("2nd");
                    var sql = `INSERT INTO coinData(rank,title,short_name,img_url,price,mCap)values(${element.rank},'${element.title}','${element.short_name}','${element.img_url}','${element.price}','${'$' + element.mCap}');`
                    // forth
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        console.log("4th");
                    });
                });
            })
        }
        res.send("REfresh")
    });
})

app.get('/coins', function (req, res) {
    con.query('SELECT rank,title,short_name,img_url,price,mCap FROM coinData;', function (error, results, fields) {
        if (error) throw error;
        res.header("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify(results));
    });
});

app.listen('3000')
console.log('Magic happens on port 3000');
exports = module.exports = app;

