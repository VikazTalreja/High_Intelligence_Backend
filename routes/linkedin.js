const express = require('express');
const { ApifyClient } = require('apify-client');
const router = express.Router();

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});


const generateKeywords = (input) => {
    return `${input} meresu LinkedIn`;
  };
  
  // Endpoint to handle keyword-based scraping
  router.post('/scrape-keyword', async (req, res) => {
    try {
      const { inputs } = req.body;
      
      // Check if inputs is provided and is an array
      if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of input objects' });
      }

      const results = [];
      const axios = require('axios');

      // Process each input object
      for (const inputObj of inputs) {
        try {
          // Validate that the input object has a name property
          if (!inputObj.name) {
            results.push({
              input: inputObj,
              error: 'Each input object must have a name property'
            });
            continue;
          }

          const name = inputObj.name.trim();
          console.log(`Processing input name: ${name}`);

          // Generate keywords
          const keywords = generateKeywords(name);

          // Use SerperDev to search for the keywords
          let data = JSON.stringify({
            "q": keywords,
            "gl": "in"
          });
          
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://google.serper.dev/search',
            headers: { 
              'X-API-KEY': process.env.SERPER_API_KEY, 
              'Content-Type': 'application/json'
            },
            data: data
          };

          const searchResponse = await axios.request(config);
          
          // Check if we have search results
          if (searchResponse.data.organic && searchResponse.data.organic.length > 0) {
            // Get the first LinkedIn URL from the results
            const firstResult = searchResponse.data.organic[0];
            const firstLink = firstResult.link;
            
            console.log(`Found link for ${name}: ${firstLink}`);

            // Check if it's a LinkedIn URL
            if (firstLink.includes('linkedin.com')) {
              // Scrape the LinkedIn profile for this link
              try {
                const profileResponse = await axios.post('http://localhost:5000/api/scrape/profile', {
                  profileUrls: [firstLink]
                });

                results.push({
                  input: inputObj,
                  searchQuery: keywords,
                  link: firstLink,
                  title: firstResult.title,
                  profileData: profileResponse.data
                });
              } catch (profileError) {
                console.error(`Error fetching profile for ${name}:`, profileError.message);
                results.push({
                  input: inputObj,
                  searchQuery: keywords,
                  link: firstLink,
                  title: firstResult.title,
                  error: `Error fetching profile: ${profileError.message}`
                });
              }
            } else {
              results.push({
                input: inputObj,
                searchQuery: keywords,
                link: firstLink,
                title: firstResult.title,
                error: 'Not a LinkedIn URL'
              });
            }
          } else {
            results.push({
              input: inputObj,
              searchQuery: keywords,
              error: 'No search results found'
            });
          }
        } catch (inputError) {
          console.error(`Error processing input:`, inputError.message);
          results.push({
            input: inputObj,
            error: `Error processing input: ${inputError.message}`
          });
        }
      }

      // Return all the collected results
      res.json({ 
        success: true, 
        count: results.length,
        results: results 
      });
    } catch (error) {
      console.error('Error in keyword-based scraping:', error);
      res.status(500).json({ error: 'Failed to scrape based on keywords', details: error.message });
    }
  });



// LinkedIn Profile Scraping endpoint
router.post('/profile', async (req, res) => {
  try {
    const { profileUrls } = req.body;
    
    if (!profileUrls || !Array.isArray(profileUrls) || profileUrls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of LinkedIn profile URLs' });
    }

    // Run the specific LinkedIn Scraper actor with ID
    const run = await apifyClient.actor("2SyF0bVxmgGr8IVCZ").call({
      profileUrls: profileUrls
    });

    // Get results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error scraping LinkedIn profiles:', error);
    res.status(500).json({ error: 'Failed to scrape LinkedIn profiles', details: error.message });
  }
});

// LinkedIn Company Scraping endpoint
router.post('/company', async (req, res) => {
  try {
    const { companyUrls } = req.body;
    
    if (!companyUrls || !Array.isArray(companyUrls) || companyUrls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of LinkedIn company URLs' });
    }

    // For company scraping, you may need to find the specific actor ID
    // This is a placeholder - replace with the correct actor ID for company scraping
    const run = await apifyClient.actor("apify/linkedin-company-scraper").call({
      linkedInCompanyUrls: companyUrls,
    });

    // Get results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error scraping LinkedIn companies:', error);
    res.status(500).json({ error: 'Failed to scrape LinkedIn companies', details: error.message });
  }
});

// LinkedIn Jobs Scraping endpoint
router.post('/jobs', async (req, res) => {
  try {
    const { searchTerms, location, limit } = req.body;
    
    if (!searchTerms) {
      return res.status(400).json({ error: 'Please provide search terms for jobs' });
    }

    // For jobs scraping, you may need to find the specific actor ID
    // This is a placeholder - replace with the correct actor ID for jobs scraping
    const run = await apifyClient.actor("apify/linkedin-jobs-scraper").call({
      searchTerms: Array.isArray(searchTerms) ? searchTerms : [searchTerms],
      locationOrFilters: location || '',
      maxItems: limit || 50,
    });

    // Get results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error scraping LinkedIn jobs:', error);
    res.status(500).json({ error: 'Failed to scrape LinkedIn jobs', details: error.message });
  }
});

module.exports = router; 