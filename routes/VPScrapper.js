const express = require('express');
const { ApifyClient } = require('apify-client');
const router = express.Router();

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});


// const generateKeywords = (input) => {
//     return `${input} meresu LinkedIn`;
//   };
  
//   // Endpoint to handle keyword-based scraping
//   router.post('/scrape-keyword', async (req, res) => {
//     try {
//       const { input } = req.body;
//       if (!input) {
//         return res.status(400).json({ error: 'Please provide an input keyword' });
//       }
  
//       // Generate keywords
//       const keywords = generateKeywords(input);
  
//       // Use SerperDev to search for the keywords
//       const axios = require('axios');
//       let data = JSON.stringify({
//         "q": "harsh Chaudari LinkedIn meresu",
//         "gl": "in"
//       });
      
//       let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: 'https://google.serper.dev/search',
//         headers: { 
//           'X-API-KEY': '438dfa5d0115af556f3385b8d16df1b7bb3c642d', 
//           'Content-Type': 'application/json'
//         },
//         data : data
//       };
  
//       const searchResponse = await axios.request(config);
//       // Get the first link from the search results
//       const firstLink = searchResponse.data.organic[0].link;
      
//       console.log(firstLink, "This is it");

//       const profileResponse = await axios.post('http://localhost:5000/api/scrape/profile', {
//         profileUrls: [firstLink]
//       });
  
//       res.json({ success: true, data: profileResponse.data });
  
//     } catch (error) {
//       console.error('Error in keyword-based scraping:', error);
//       res.status(500).json({ error: 'Failed to scrape based on keywords', details: error.message });
//     }
//   });



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

// Endpoint to search for procurement executives by company name
router.post('/find-procurement-execs', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: 'Please provide a company name' });
    }

    // List of procurement executive titles
    const procurementTitles = [
      "Chief Procurement Officer",
      "CPO",
      "Chief Supply Chain Officer",
      "CSCO",
      "Director of Procurement",
      "Vice President of Procurement",
      "Head of Procurement",
      "General Manager Procurement",
      "Senior Procurement Manager"
    ];

    // Generate search keywords for each title
    const searchQueries = procurementTitles.map(title => 
      `${companyName} ${title} LinkedIn`
    );

    console.log("Generated search queries:", searchQueries);

    const results = [];
    const axios = require('axios');

    // Process each search query
    for (const query of searchQueries) {
      try {
        console.log(`Searching for: ${query}`);
        
        // Use SerperDev to search
        let data = JSON.stringify({
          "q": query,
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
          const linkedInUrl = searchResponse.data.organic[0].link;
          console.log(linkedInUrl);
          
          // Check if the URL is a LinkedIn profile URL
          if (linkedInUrl.includes('linkedin.com/in/')) {
            console.log(`Found LinkedIn profile for "${query}":`, linkedInUrl);
            
            // Scrape the LinkedIn profile
            try {
              const profileResponse = await axios.post('http://localhost:5000/api/scrape/profile', {
                profileUrls: [linkedInUrl]
              });
              
              results.push({
                query: query,
                title: searchResponse.data.organic[0].title,
                profileUrl: linkedInUrl,
                profileData: profileResponse.data
              });
            } catch (profileError) {
              console.error(`Error scraping profile for "${query}":`, profileError.message);
              results.push({
                query: query,
                title: searchResponse.data.organic[0].title,
                profileUrl: linkedInUrl,
                error: `Error scraping profile: ${profileError.message}`
              });
            }
          } else {
            console.log(`No LinkedIn profile found for "${query}"`);
            results.push({
              query: query,
              error: "No LinkedIn profile found in search results"
            });
          }
        } else {
          console.log(`No search results for "${query}"`);
          results.push({
            query: query,
            error: "No search results found"
          });
        }
      } catch (searchError) {
        console.error(`Error searching for "${query}":`, searchError.message);
        results.push({
          query: query,
          error: `Search error: ${searchError.message}`
        });
      }
    }

    // Return all results
    res.json({ 
      success: true, 
      companyName: companyName,
      executivesFound: results.filter(r => !r.error).length,
      results: results 
    });
  } catch (error) {
    console.error('Error finding procurement executives:', error);
    res.status(500).json({ 
      error: 'Failed to find procurement executives', 
      details: error.message 
    });
  }
});

module.exports = router; 