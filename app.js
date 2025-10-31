/******************************************************************************
***
*  ITE5315 – Assignment 2
*  I declare that this assignment is my own work in accordance with Humber Academic Policy.
*  No part of this assignment has been copied manually or electronically from any other source
*  (including web sites) or distributed to other students.
*
*  Name: Jeffrey Lamptey
*  Student ID: N01675664
*  Date: Oct 29, 2025
*
******************************************************************************/

// ** Add the following to app.js ***
const express = require('express');
const path = require('path');
const fs = require('fs');

// Handlebars setup
const { engine } = require('express-handlebars');
const { query, validationResult } = require('express-validator');

// Create Express app
const app = express();

// Case-sensitive routing (kept from A1)
app.set("case sensitive routing", true);

// Load Airbnb data
const myData = path.join(__dirname, "data", "airbnb_with_photos.json");

let AirBnb = [];
try {
AirBnb = JSON.parse(fs.readFileSync(myData, 'utf8'));
console.log(`Airbnb data loaded successfully. Total records: ${AirBnb.length}`);
} catch (e) {
console.log("Error reading file:", e);
}

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars configuration with helpers
app.engine('hbs', engine({ 
    extname: '.hbs', 
    helpers: {
        feeCheck: (fee) => {
            
            const amount = parseFloat(String(fee).replace(/[^0-9.-]+/g,"")) || 0;
            return fee > 0 ? 'Yes' : 'No';
        }
        ,
       
        serviceFeeHighlight: (fee) => {
            const str = String(fee).trim();
            return str === '' || str === '$0' ? 'highlight' : '';
        }
            
    },
   //new insertions
 defaultLayout: 'main', // use 'views/layouts/main.hbs' as default
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')

}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Home route
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', message: 'Welcome to the Airbnb Listings',
    links: [

      { url: '/view-data', text: 'View All Listings' },
    { url: '/view-data/clean', text: 'View Cleaned' },
    { url: '/view-data/price', text: 'View Sorted by Price' },
      { url: '/search-id-index/0', text: 'Search Listings by Index (0)' },
        { url: '/search-id', text: 'Search Listings by ID' },
        { url: '/search-name', text: 'Search Listings by Name' },
        { url: '/price-form', text: 'Search Listings by Price Range' }
    ] });
});


//Search by Index
app.get('/search-id-index', (req, res) => {
    if (req.query.index !== undefined) {
        const index = parseInt(req.query.index, 10);
        if (isNaN(index) || index < 0 || index >= AirBnb.length) {
            return res.status(404).render('search-id-index', { 
                title: 'Search Listing by Index', 
                message: 'Record not found' });
        }
        return res.redirect(`/search-id-index/${index}`);
    }
  res.render('search-id-index', { title: 'Search Listing by Index' });
});

app.get('/search-id-index/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0 || index >= AirBnb.length) {
    return res.status(404).render('error', { 
        title: 'Error', 
        message: 'Record not found' });
  }
  res.render('search-id-index', { 
    title: 'Search Listing by Index', 
    listing: AirBnb[index] });
});

//Search by ID (GET form + bookmarkable GET results
app.get('/search-id', (req, res) => {
  res.render('search-id', { title: 'Search Listing by ID' });
});

app.get('/search-id/result',
    [query('id').trim()
        .notEmpty().withMessage('ID is required')
        .isInt({ min: 1 }).withMessage('ID must be a number')],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('error', {
                title: 'Error', 
                message: errors.array().map(err => err.msg).join(', ')
            });
        }   
        const id = parseInt(req.query.id, 10);
        const listing = AirBnb.find(item => parseInt(item.id, 10) === id);
        if (!listing) {
            return res.status(404).render('error', { 
                title: 'Error', 
                message: 'Listing with ID not found' });
        }
        res.render('search-id', { 
            title: 'Search Listing by ID', 
            listing,
        query: {id}, });
    });

    //  Search by NAME 
app.get('/search-name', (req, res) => {
  res.render('search-name', { title: 'Search Listing by Name' });
});

app.get('/search-name/result',
    [query('name').trim()
        .notEmpty().withMessage('Name is required')],
    (req, res) => { 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('error', {    
                title: 'Error', 
                message: errors.array().map(err => err.msg).join(', ')
            });
        }   
        const nameQuery = req.query.name.toLowerCase();
        const listings = AirBnb.filter(item => 
            item.NAME && item.NAME.toLowerCase().includes(nameQuery));   
        if (listings.length === 0) {
            return res.status(404).render('error', { 
                title: 'Error', 
                message: 'No listings found with that name' });
        }
        res.render('search-name', { 
            title: 'Search Listing by Name', 
            listings,
        query: {name:req.query.name}, });
    });

    // View data - All data as a table
app.get('/view-data', (req, res) => {
    console.log('Rendering all listings...');
     const reducedListings = AirBnb.slice(0, 200);

  res.render('view-data', { 
    title: 'View All Listings', 
    message: 'Welcome to our listings',
    listings: reducedListings });
});

// View data - Cleaned cleaning_fee
app.get('/view-data/clean', (req, res) => {
    const cleanedListings = AirBnb.map(listing => {
        const cleanedListing = { ...listing };  
        cleanedListing.cleaning_fee = cleanedListing.cleaning_fee === '' ? '$0' : cleanedListing.cleaning_fee;
        return cleanedListing;
    });
     const reducedCleaned = cleanedListings.slice(0, 200);
    res.render('view-data', { 
        title: 'View Listings with Cleaned Cleaning Fee', 
        message: 'Listings with cleaned cleaning fee data',
        listings: reducedCleaned });
});

//Sorted by price view
app.get('/view-data/price', (req, res) => {
  const sortedListings = [...AirBnb].sort((a, b) => {
    const priceA = parseFloat(String(a.price).replace(/[^0-9.-]+/g, ''));
    const priceB = parseFloat(String(b.price).replace(/[^0-9.-]+/g, ''));
    return priceA - priceB;
  });

  const reducedSorted = sortedListings.slice(0, 200);
  res.render('view-data', {
    title: 'View All Listings Sorted by Price',
    message: 'Listings sorted by price (low to high)',
    listings: reducedSorted
  });
});


    // Price range form + results
app.get('/price-form', (req, res) => {
  res.render('price-form', { title: 'Search Listings by Price' });
});
// Price range results with validation
app.get('/price-form/result',  
    [query('min').trim()
        .notEmpty().withMessage('Min is required')
        .isFloat({ min: 50 }).withMessage('Min must be a number above 50!'),
    query('max').trim()
        .notEmpty().withMessage('Max is required')
        .isFloat({ max: 3000 }).withMessage('Max must be a number above 50!')],
    (req, res) => { 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {    
            return res.status(400).render('error', {    
                title: 'Error', 
                message: errors.array().map(err => err.msg).join(', ')
            });
        }   
        const minPrice = parseFloat(req.query.min);
        const maxPrice = parseFloat(req.query.max);
        const listings = AirBnb.filter(item => {
            const price = parseFloat(item.price.replace(/[^0-9.-]+/g,""));
            return !isNaN(price) && price >= minPrice && price <= maxPrice;
        });   
        if (listings.length === 0) {
            return res.status(404).render('error', { 
                title: 'Error', 
                message: 'No listings found in that price range' });
        }
        const limitedListings = listings.slice(0, 20);
        res.render('price-form', { 
            title: 'Search Listings by Price', 
            listings,
        query: {min:req.query.min, max:req.query.max}, });
    });
    


// app.get('/users', function(req, res) {
//   res.send('respond with a resource');
// });
app.get('/{*splat}', function (req, res) {
    res.render('error', { title: 'Error', message: 'Wrong Route' });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

