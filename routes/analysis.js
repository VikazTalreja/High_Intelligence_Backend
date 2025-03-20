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
      procurementExecutives: null,
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
      } catch (vpError) {
        console.error('Error finding procurement executives:', vpError);
        analysisResults.errors.push({
          source: 'Procurement Executives',
          message: vpError.message
        });
      }
    }
    
    // 4. Process competitor analysis
    if (formData.competitors && Array.isArray(formData.competitors)) {
      try {
        // Get selected competitors
        const selectedCompetitors = formData.competitors.filter(comp => comp.selected);
        console.log(`Processing ${selectedCompetitors.length} selected competitors`);

        // Process competitors in batches of 3 to avoid overwhelming the server
        const batchSize = 3;
        const allAnalyses = [];
        
        for (let i = 0; i < selectedCompetitors.length; i += batchSize) {
          const batch = selectedCompetitors.slice(i, i + batchSize);
          console.log(`Processing batch ${i/batchSize + 1} with ${batch.length} competitors`);
          
          const batchAnalyses = await Promise.all(
            batch.map(async (competitor) => {
              try {
                console.log(`Starting analysis for competitor: ${competitor.name}`);
                
                // Call the otherCompetitor analyze endpoint
                const otherCompResponse = await axios.post('https://high-intelligence-backend.onrender.com/api/othercompetitor/analyze', {
                  companyName: formData.companyName,
                  competitorName: competitor.name,
                  dataType: formData.projectDetails || 'TMT' // Default to TMT, can be modified based on requirements
                });

                if (otherCompResponse.data.success) {
                  console.log(`Successfully analyzed competitor: ${competitor.name}`);
                  return {
                    competitor: competitor.name,
                    ...otherCompResponse.data.analysis
                  };
                }
                
                console.log(`Analysis failed for competitor: ${competitor.name}`);
                analysisResults.errors.push({
                  source: 'CompetitorAnalysis',
                  message: `Analysis failed for ${competitor.name}: No success response`
                });
                return null;
              } catch (error) {
                console.error(`Error analyzing competitor ${competitor.name}:`, error);
                analysisResults.errors.push({
                  source: 'CompetitorAnalysis',
                  message: `Error analyzing ${competitor.name}: ${error.message}`,
                  details: error.response?.data || error.message
                });
                return null;
              }
            })
          );

          // Add successful analyses from this batch
          allAnalyses.push(...batchAnalyses.filter(analysis => analysis !== null));
          
          // Add a small delay between batches to prevent rate limiting
          if (i + batchSize < selectedCompetitors.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Add all successful analyses to the results
        if (allAnalyses.length > 0) {
          analysisResults.CompetitorsEngagement = allAnalyses;
          console.log(`Successfully completed analysis for ${allAnalyses.length} out of ${selectedCompetitors.length} competitors`);
        } else {
          console.log('No successful competitor analyses completed');
          analysisResults.errors.push({
            source: 'CompetitorsEngagement',
            message: 'No competitor analyses were successful'
          });
        }

      } catch (error) {
        console.error('Error processing competitors:', error);
        analysisResults.errors.push({
          source: 'CompetitorsEngagement',
          message: 'Failed to process competitors',
          details: error.message
        });
      }
    } else {
      console.log('No competitors to analyze or invalid competitors data');
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