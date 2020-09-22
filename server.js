'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const pg = require('pg');
const superagnet = require('superagent');
const methodOverRide = require('method-override');

const PORT = process.env.PORT || 3030;

app.use(express.urlencoded({ extended: true }));
app.use(methodOverRide('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

const client = new pg.Client(process.env.DATABASE_URL);

// Routs
app.get('/', homePageHanlde);
app.get('/getByDate', getCityDataWithDate);
app.get('/getAllCountires', getDataForAllCountires);
app.post('/addToDataBase', addRecordToDB);
app.get('/record', getAllRecords);
app.get('/details/:cID', getDetails);
app.delete('/deleteFromDB/:cID', deleteFromDB);
app.put('/update/:cID', updateFromDB);

// Functions

// Home Page function

function homePageHanlde(req, res) {
  const URL = `https://api.covid19api.com/world/total`;
  superagnet.get(URL).then((result) => {
    res.render('pages/homepage', { worldData: result.body });
  });
}

function getAllRecords(req, res) {
  const selectSQL = 'SELECT * FROM countries';
  client.query(selectSQL).then((result) => {
    res.render('pages/detailsPage', { All: result.rows });
  });
}

function getCityDataWithDate(req, res) {
  const { choice, from, to } = req.query;
  const URL = `https://api.covid19api.com/country/${choice}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
  superagnet.get(URL).then((result) => {
    let dataArray = result.body.map((item) => {
      return new Country(item);
    });
    res.render('pages/country', { names: dataArray });
  });
}

// get data for all countirs

function getDataForAllCountires(req, res) {
  const URL = `https://api.covid19api.com/summary`;
  superagnet.get(URL).then((result) => {
    // The array is result.bosy.Countries;
    let countryArray = result.body.Countries.map((country) => {
      return new AllCountires(country);
    });
    res.render('pages/allcountires', { All: countryArray });
  });
}

// Add to data base
function addRecordToDB(req, res) {
  const { country, cCases, dCaese, rCaese, date } = req.body;
  const insertSQL =
    'INSERT INTO countries (country,cCases,dCaese,rCaese,date) VALUES ($1,$2,$3,$4,$5)';
  const values = [country, cCases, dCaese, rCaese, date];
  client.query(insertSQL, values).then(() => {
    const sql = 'SELECT * FROM countries ORDER BY id DESC LIMIT 1';
    client.query(sql).then((result) => {
      res.redirect(`/details/${result.rows[0].id}`);
    });
  });
}

// Get Deatils

function getDetails(req, res) {
  const { cID } = req.params;
  const selectSQL = 'SELECT * FROM countries WHERE id=$1';
  const values = [cID];
  client.query(selectSQL, values).then((result) => {
    res.render('pages/details', { data: result.rows[0] });
  });
}

// Delete From DB

function deleteFromDB(req, res) {
  const { cID } = req.params;
  const deleteSQL = 'DELETE FROM countries WHERE id=$1';
  const values = [cID];
  client.query(deleteSQL, values).then((result) => {
    res.redirect('/record');
  });
}
// Update DAtaBAse
function updateFromDB(req, res) {
  const { country, cCases, dCaese, rCaese, date } = req.body;
  const updateSQL =
    'UPDATE countries SET country=$1,ccases=$2,dcaese=$3,rcaese=$4, date=$5 WHERE id=$6';
  const values = [country, cCases, dCaese, rCaese, date, req.params.cID];
  client.query(updateSQL, values).then(() => {
    res.redirect(`/details/${req.params.cID}`);
  });
}

// constructors

// Country

function Country(name) {
  this.date = name.Date ? name.Date : 'There is No Date in the API';
  this.cases = name.Cases ? name.Cases : 'There is No Cases in the API';
}

// All Countires

function AllCountires(country) {
  this.name = `${country.Country},${country.CountryCode}`;
  this.cCases =
    parseInt(country.NewConfirmed) + parseInt(country.TotalConfirmed);
  this.dCaese = parseInt(country.NewDeaths) + parseInt(country.TotalDeaths);
  this.rCaese =
    parseInt(country.NewRecovered) + parseInt(country.TotalRecovered);
  this.date = country.Date;
}
// Test Connection

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('Working', PORT);
  });
});
