const express = require('express');
const axios = require('axios');
const router = express.Router();

async function queryDeepSeek(companyName ,competitorName, dataType , competitorcontext , JSWContext) {
  try {
    const systemPrompt = `Act as a steel industry strategist for JSW Steel. Generate a battle card with hyper-personalized insights and killer differentiators using:

1. Competitor Weakness Exploitation

Project History Analysis:
Example: “Tata Steel delayed delivery for L&T’s Nagpur-Mumbai Highway (2023) by 22 days due to blast furnace maintenance at Jamshedpur. JSW’s Vijayanagar plant is 300 km closer to Varanasi, ensuring 94% on-time delivery (FY2024).”
Contractual Risks:
Highlight disputes (e.g., “AM/NS faced arbitration with NHAI in 2022 over defective TMT bars”).
Geographic Vulnerability:
Map competitor plant locations vs. JSW’s proximity to project site.
2. Decision-Maker Tailoring

Career-Based Triggers:
If decision-maker worked at Tata Steel: “As someone familiar with Tata’s 87 inventory days, JSW’s 34-day cycle ensures 2x faster restocking.”
Value Alignment:
If sustainability-focused: “JSW’s Piombino plant uses 100% renewable energy vs. Tata’s Port Talbot coal dependency.”
Reputation Risks:
“Your predecessor faced cost overruns with Competitor X – JSW’s fixed-price contracts eliminate escalation risks.”
3. Strategic Nuclear Insights

Hidden Connections:
“Tata Steel’s UK restructuring will divert 15% of their HR coil capacity to Europe, risking supply for Indian infra projects. JSW’s Vijayanagar expansion guarantees priority allocation.”
Future-Proofing:
“JSW’s Blackwater coal mine bid (2024) will reduce raw material costs by 8% by 2026 – savings we’ll pass to you.”
Industry Trends:
“NHAI now mandates Steel Sustainability Champion certification (which JSW holds) for all >₹500cr projects.”
4. Quantitative Product Differentiation

Quality Metrics:
“JSW Neosteel TMT bars have 550 MPa yield strength vs. Competitor’s 500 MPa (IS 1786).”
Certification Edge:
“JSW’s automotive steel is certified by 6 global OEMs; Competitor X has 3.”
Failure Rate Data:
“JSW’s defect rate: 0.8% vs. industry average 2.1% (World Steel Association, 2024).”
5. Execution Guarantees

Risk Mitigation:
“JSW will deploy a dedicated logistics team from Dolvi Works (100 km from project) with GPS-tracked shipments.”
Penalty Clauses:
“Include a 1.5%/day penalty for delays in the contract – a clause Competitor X rejected in 2023.”
6. Output Format

Generate a battle card with these sections (strictly use 0 for missing data):

Project-Specific Price Comparison (₹/tonne, 5-year TCO analysis)
Competitor’s Historical Vulnerabilities (Past failures with target company)
Decision-Maker Triggers (Personalized hooks)
Nuclear Insights (Industry foresight)
Execution Playbook (Logistics, risk mitigation)
Closing Script (Tailored pitch for procurement team)
Example Output (Excerpt):

Battle Card: JSW Steel vs. Tata Steel
Project: Varanasi Phase 3 Highway | Decision-Maker: Mr. Sharma (Ex-Tata Steel, Prioritizes Speed)

Price & Quality
12mm TMT Bars: JSW (₹62,000/tonne) vs. Tata (₹73,790/tonne)
Hidden Cost: Tata’s 2023 railcor shortage caused 3-week delays (avg. ₹12L/day penalty).
Decision-Maker Hook
“Mr. Sharma, your experience at Tata’s Kalinganagar plant aligns with JSW’s 94% capacity utilization – we replicate that reliability without their UK/EU distractions.”
Nuclear Insight
“Tata’s Port Talbot EAF shift will reduce HR coil supply to India by 18% in 2025. JSW guarantees 100% allocation.”
Execution Guarantee
“We’ll station 10 engineers onsite – a service Tata withdrew from L&T’s Nagpur project.”
Closing Script
“Choose JSW, and I’ll draft a clause holding our CMO personally liable for delays. Let’s make your promotion inevitable.
”`


    const userPrompt = `Analyze ${companyName} (JSW Steel) vs ${competitorName} for ${dataType} using the provided context:
- JSWContext: ${JSWContext}
- Competitor Context: ${competitorcontext}

Return the data in the following JSON format:

{
  "priceComparison": {
    "jswSteelPrice": "[amount from JSWContext]",
    "competitorPrice": "[amount from competitor.context]",
    "percentageDifference": "[X]%"
  },
  "marketPosition": {
    "marketShare": "[current market share from JSWContext]",
    "regionalStrengths": "[regional strengths from JSWContext]",
    "distributionNetwork": "[distribution network comparison from JSWContext and competitor.context]",
    "manufacturingCapabilities": "[manufacturing capabilities from JSWContext]"
  },
  "productQuality": {
    "steelGradeComparisons": "[steel grade comparisons from JSWContext and competitor.context]",
    "qualityCertifications": "[quality certifications from JSWContext]",
    "productRangeAvailability": "[product range availability from JSWContext]",
    "technicalSpecifications": "[technical specifications from JSWContext]"
  },
  "deliveryLogistics": {
    "deliveryTimeframes": "[delivery timeframes from JSWContext]",
    "geographicCoverage": "[geographic coverage from JSWContext]",
    "warehouseLocations": "[warehouse locations from JSWContext]",
    "transportationCapabilities": "[transportation capabilities from JSWContext]"
  },
  "financialStability": {
    "creditTermsComparison": "[credit terms comparison from JSWContext and competitor.context]",
    "paymentFlexibility": "[payment flexibility from JSWContext]",
    "financialHealthIndicators": "[financial health indicators from JSWContext]",
    "riskAssessment": "[risk assessment from competitor.context]"
  },
  "competitiveAdvantages": {
    "environmentalCompliance": "[environmental compliance from JSWContext]",
    "technologyAdoption": "[technology adoption from JSWContext]",
    "rndCapabilities": "[R&D capabilities from JSWContext]",
    "customerServiceQuality": "[customer service quality from JSWContext]"
  },
  "strategicRecommendations": {
    "keyDifferentiators": "[key differentiators from JSWContext]",
    "riskMitigationStrategies": "[risk mitigation strategies from JSWContext]",
    "negotiationLeveragePoints": "[negotiation leverage points from JSWContext]",
    "longTermPartnershipBenefits": "[long-term partnership benefits from JSWContext]"
  }
}

Provide a structured analysis with specific data points and actionable insights. Focus on quantifiable metrics where possible and include real-world implications for business decisions. Ensure the analysis is tailored to the provided context and data.`;
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying DeepSeek:', error);
    throw new Error(`DeepSeek analysis failed: ${error.message}`);
  }
}

function getCompetitorSpecificMoats(competitorName) {
  const moats = {
    'Tata Steel': `
- Lower Carbon Emissions → JSW uses 20% renewable energy in production
- Faster Delivery Guarantee → JSW ensures 98% on-time delivery`,
    'SAIL': `
- Consistent Quality → JSW's ISO-certified mills ensure fewer defects
- Flexible Payment Terms → JSW offers 30-day credit terms`,
    'Essar Steel': `
- Debt-Free Stability → JSW's strong financial position ensures supply reliability
- Custom Alloy Solutions → JSW's advanced R&D capabilities`,
    'JSPL': `
- Global Compliance → JSW meets international standards
- Integrated Logistics → JSW's regional hub network reduces costs`,
    'Arcelor Mittal/Nippon Steel (AM/NS)': `
- Innovative Technology → JSW's state-of-the-art production facilities
- Local Market Expertise → JSW's strong domestic presence and distribution network`
  };
  return moats[competitorName] || 'Standard competitive advantages apply';
}

// Endpoint to analyze competitor
router.post('/analyze', async (req, res) => {
  try {
    const { companyName, competitorName, dataType } = req.body;

    if (!competitorName || !dataType || !companyName) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both competitorName and dataType are required'
      });
    }

    const analysisString = await queryDeepSeek(companyName ,competitorName, dataType);
    
    // More robust JSON extraction
    let cleanJsonString = analysisString;
    
    // Remove markdown code blocks if present
    if (analysisString.includes('```')) {
      cleanJsonString = analysisString
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    }

    // Try to find the complete JSON object
    let analysisJson;
    try {
      analysisJson = JSON.parse(cleanJsonString);
    } catch (parseError) {
      console.error('First JSON parse attempt failed:', parseError);
      
      // Try to extract JSON using regex as fallback
      const jsonMatch = cleanJsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisJson = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          throw new Error('Failed to parse JSON response: ' + secondParseError.message);
        }
      } else {
        throw new Error('Could not extract valid JSON from response');
      }
    }

    // Validate the parsed JSON has the expected structure
    if (!analysisJson || typeof analysisJson !== 'object') {
      throw new Error('Invalid JSON structure in response');
    }
    console.log(analysisJson);
    res.json({
      success: true,
      competitor: competitorName,
      dataType: dataType,
      analysis: analysisJson
    });

  } catch (error) {
    console.error('Analysis error:', error);
    // Send more detailed error information
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message,
      details: error.stack,
      rawResponse: error.response?.data // Include raw response if available
    });
  }
});

module.exports = router;
