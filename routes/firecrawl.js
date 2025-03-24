const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint to get company information
router.post('/scrape', async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: 'Please provide a company name' });
    }

    console.log(`Processing company: ${companyName}`);

    // Define the prompt for Perplexity
    const prompt = `Generate a JSON structured report for ${companyName} in India. Follow these rules:

Mandatory Fields: If data for a field is unavailable, return 0. Do not omit fields.
Prioritize Indian Sources: MCA21, SEBI, BSE/NSE, GSTIN databases, and Indian business news.
Include the following sections:

Basic_Company_Details:
Legal Name, Trading Name, CIN, Registration Date.
Company Type (Public Ltd/Private Ltd/LLP/OPC), Industry (NIC Code).
Registered Office (with state), Headquarters, Contact Details (Phone, Email, Website).
Parent Company, Subsidiaries, or Joint Ventures.
Legal & Compliance Details:
GSTIN, PAN, TAN, MSME/Startup India Status.
ROC Office, Active Compliance Status (MCA21), Pending Litigations/Defaults.
List of Directors (with DINs), Promoters, CEO, CFO.
Financial Health & Cash-Rich Status:
Cash Reserves: Cash & equivalents (latest fiscal year).
Cash Flow: Operating/Investing/Financing cash flow (3-year trend).
Cash Ratios: Cash Ratio (Cash + Equivalents / Current Liabilities), Free Cash Flow.
Cash-Rich Status: Qualitative assessment (e.g., "High liquidity with ₹X Cr reserves, exceeding industry average").
Revenue, Net Profit, Debt-to-Equity Ratio, Credit Rating (CRISIL/ICRA).
Stock Data (if listed): BSE/NSE Symbol, Market Cap, Promoter/FII Holdings.
Top 3 Most Recent Big News (Last 12 Months):
Strictly include 3 news items. If unavailable, set individual entries to 0.
Format per news: { "headline": "...", "date": "DD-MM-YYYY", "source": "...", "impact": "..." }.
Focus on: Mergers/Acquisitions, Regulatory Actions, Expansions, Major Contracts, Fraud Cases.
Example Sources:

Financials: MCA21 Filings, Tofler, Prowess IQ.
Compliance: GST Portal, SEBI, IBBI (Insolvency Records).
News: Economic Times, Moneycontrol, Business Today, PTI.
Prompt for Web Scraping Component (India-Specific):

"Develop a scraper targeting Indian platforms to extract:

Cash-Rich Metrics:
Cash reserves, free cash flow, and cash ratio from Annual Reports (Balance Sheet, Cash Flow Statements).
Compare reserves to industry peers (e.g., "Cash reserves 30% higher than sector average").
Top 3 Recent News:
Scrape headlines, dates, sources, and summarize impact from Indian business news sites.
If <3 news items exist, fill missing entries with 0.
Technical Adjustments:
Output JSON with strict 0 for missing fields (e.g., "cash_reserves": 0).
Use proxies/rotating headers for sites like Zauba Corp or MCA21 to avoid blocking.
Handle CAPTCHAs on GST Portal/Udyam Registration ethically (e.g., manual solve). give me complete`;

    // Call Perplexity API to search for company information
    try {
      const perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that provides accurate and detailed information about companies. Return ONLY the JSON object with no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      // Extract and parse the JSON response
      const responseContent = perplexityResponse.data.choices[0].message.content;
      let perplexityData;
      console.log(responseContent)
      
      try {
        // Find the JSON object in the response
        const jsonStartIndex = responseContent.indexOf('{');
        const jsonEndIndex = responseContent.lastIndexOf('}') + 1;
        const jsonString = responseContent.substring(jsonStartIndex, jsonEndIndex);
        
        // Parse the JSON string
        perplexityData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing Perplexity data:', parseError);
        return res.status(500).json({
          error: 'Failed to parse company data',
          details: parseError.message
        });
      }

      // Return the parsed data
      res.json({
        success: true,
        companyName: companyName,
        data: perplexityData
      });
    } catch (perplexityError) {
      console.error('Error in Perplexity search:', perplexityError);
      res.status(500).json({
        error: 'Failed to fetch company information',
        details: perplexityError.message
      });
    }

  } catch (error) {
    console.error('Error processing company:', error);
    res.status(500).json({ 
      error: 'Failed to process company information', 
      details: error.message 
    });
  }
});

// Endpoint to scrape multiple URLs with Firecrawl
router.post('/scrape-batch', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of URLs to scrape' });
    } 

    console.log(`Batch scraping ${urls.length} URLs`);
    const results = [];

    // Process each URL
    for (const url of urls) {
      try {
        console.log(`Scraping URL: ${url}`);
        
        // Make request to Firecrawl API
        const options = {
          method: 'POST',
          url: 'https://api.firecrawl.dev/v1/scrape',
          headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          data: {
            url: url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 0,
            mobile: false,
            skipTlsVerification: false,
            timeout: 30000,
            location: {
              country: 'US'
            },
            blockAds: true
          }
        };

        const firecrawlResponse = await axios(options);
        
        results.push({
          url: url,
          success: true,
          data: firecrawlResponse.data
        });
      } catch (urlError) {
        console.error(`Error scraping URL ${url}:`, urlError);
        results.push({
          url: url,
          success: false,
          error: urlError.message
        });
      }
    }

    // Return all results
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in batch Firecrawl scraping:', error);
    res.status(500).json({ error: 'Failed to batch scrape with Firecrawl', details: error.message });
  }
});

module.exports = router; 