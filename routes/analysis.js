const express = require('express');
const axios = require('axios');
const router = express.Router();

// Main analysis endpoint that processes form data and calls multiple APIs
router.post('/run', async (req, res) => {
  try {
    const formData = req.body;
    
    if (!formData) {
      return res.status(400).json({ error: 'Please provide form data' });
    }

    console.log('Received form data for analysis:', formData);

    // Extract key decision makers if available
    const keyDecisionMakers = formData.keyDecisionMakers || [];
    console.log('Key Decision Makers:', keyDecisionMakers);

    // Initialize results object
    const analysisResults = {
      success: true,
      timestamp: new Date().toISOString(),
      formData: formData, // Include the original form data
      linkedInData: null,
      companyData: null,
      marketData: null,
      aiInsights: null,
      procurementExecutives: null, // Add field for procurement executives
      CompetitorsEngagement: [],
      errors: []
    };

    // 1. Process LinkedIn profiles for key decision makers
    if (keyDecisionMakers && keyDecisionMakers.length > 0) {
      try {
        // Format the data for the LinkedIn scraper API
        const linkedInInputs = keyDecisionMakers.map(person => ({ name: person }));
        
        // Call the LinkedIn scraper endpoint
        const linkedInResponse = await axios.post('https://high-intelligence-backend.onrender.com/api/scrape/scrape-keyword', {
          inputs: linkedInInputs
        });
        
        analysisResults.linkedInData = linkedInResponse.data;
        console.log(`Successfully scraped ${linkedInResponse.data.count} LinkedIn profiles`);
      } catch (linkedInError) {
        console.error('Error scraping LinkedIn profiles:', linkedInError);
        analysisResults.errors.push({
          source: 'LinkedIn',
          message: linkedInError.message
        });
      }
    }

    // 2. Process company data using Firecrawl if company name is provided
    if (formData.companyName) {
      try {
          // Call the Firecrawl API to scrape company data
          const firecrawlResponse = await axios.post('https://high-intelligence-backend.onrender.com/api/firecrawl/scrape', {
            companyName: formData.companyName
          });
          analysisResults.companyData = firecrawlResponse.data;
          console.log('Successfully scraped company data:', firecrawlResponse.data);
      } catch (companyError) {
        console.error('Error scraping company data:', companyError);
        analysisResults.errors.push({
          source: 'Company',
          message: companyError.message
        });
      }
    }

    // 3. Find procurement executives using VPScrapper 
    if (formData.companyName) {
      try {
        // Call the VPScrapper API to find procurement executives
        const vpScrapperResponse = await axios.post('https://high-intelligence-backend.onrender.com/api/vp/find-procurement-execs', {
          companyName: formData.companyName
        });
        
        analysisResults.procurementExecutives = vpScrapperResponse.data;
        console.log('Successfully found procurement executives');
        
        // We're not adding procurement executives to LinkedIn results anymore
        // to avoid duplication in the frontend
      } catch (vpError) {
        console.error('Error finding procurement executives:', vpError);
        analysisResults.errors.push({
          source: 'Procurement Executives',
          message: vpError.message
        });
      }
    }
    
    // Check if projectDetails, any selected competitor, and industry are present
    const hasProjectDetails = formData.projectDetails && formData.projectDetails.trim() !== '';
    const hasIndustry = formData.industry && formData.industry.trim() !== '';

    if (hasProjectDetails && hasIndustry) {
      try {
        // Call the /analyze endpoint for the company
        const analyzeResponse = await axios.post('https://high-intelligence-backend.onrender.com/api/deepseek/analyze', {
          competitorName: formData.companyName,
          dataType: 'pricing'
        });

        // Add the analysis result
        analysisResults.CompetitorsEngagement = [{
          competitor: formData.companyName,
          analysis: analyzeResponse.data
        }];
        console.log(`Successfully analyzed competitor engagement for ${formData.companyName}:`, analyzeResponse.data);
      } catch (analyzeError) {
        console.error(`Error analyzing competitor engagement for ${formData.companyName}:`, analyzeError);
        analysisResults.errors.push({
          source: 'CompetitorsEngagement',
          message: `Error analyzing ${formData.companyName}: ${analyzeError.message}`
        });
      }
    }
    
    // Return the combined results
    res.json(analysisResults);
  } catch (error) {
    console.error('Error running analysis:', error);
    res.status(500).json({ 
      error: 'Failed to run analysis', 
      details: error.message 
    });
  }
});

module.exports = router; 