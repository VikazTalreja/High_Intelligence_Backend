const express = require('express');
const axios = require('axios');
const router = express.Router();

// Hardcoded keyword generator
const generateKeywords = (input) => {
  inputs = ["Harsh Chaudhary", "John Smith", "Jane Doe"];
  return inputs;
};

// Endpoint to handle keyword-based scraping
router.post('/scrape-keyword', async (req, res) => {
  try {
    const { inputs } = req.body;
   
    const results = [];
    const axios = require('axios');

    // Process each input keyword
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      console.log(`Processing input ${i+1}/${inputs.length}: ${input}`);
      
      try {
        // Generate keywords for this input
        const keywords = generateKeywords(input);
        console.log(`Generated keywords: ${keywords}`);

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
            'X-API-KEY': '438dfa5d0115af556f3385b8d16df1b7bb3c642d', 
            'Content-Type': 'application/json'
          },
          data: data
        };

        const searchResponse = await axios.request(config);
        
        // Get all links from the search results
        const searchResults = searchResponse.data.organic;
        console.log(`Found ${searchResults.length} results for ${input}`);

        // Store all search results for this input
        const inputResults = {
          input: input,
          searchResults: []
        };

        // Process each search result
        for (const result of searchResults) {
          const link = result.link;
          console.log(`Processing link: ${link}`);

          // Fetch the LinkedIn profile for this link
          try {
            // Add this result to our collection
            inputResults.searchResults.push({
              link: link,
              title: result.title,
              snippet: result.snippet,
              profileData: profileResponse.data
            });
            console.log(`Successfully processed ${input}`);
          } catch (error) {
            inputResults.searchResults.push({
              link: link,
              title: result.title,
              snippet: result.snippet,
            });
          }
        }
        results.push(inputResults);
        console.log(`Successfully processed all results for ${input}`);
      } catch (inputError) {
        console.error(`Error processing input ${input}:`, inputError.message);
        results.push({
          input: input,
          error: `Error during processing: ${inputError.message}`
        });
      }
    }

    // Return all the collected results
    console.log(`Processed ${results.length} inputs`);
    res.json({ success: true, data: results });

  } catch (error) {
    console.error('Error in keyword-based scraping:', error);
    res.status(500).json({ error: 'Failed to scrape based on keywords', details: error.message });
  }
});

module.exports = router;