const express = require('express');
const axios = require('axios');
const router = express.Router();

async function queryDeepSeek(competitorName, dataType) {
  try {
    const systemPrompt = `Act as a steel pricing analyst for JSW Steel. The user will provide project details specifying the required quantity (in tons) of one steel product (TMT Bars, HR Plates, or CR Plates) and a selected competitor (Tata Steel, SAIL, Essar Steel, or JSPL). Perform the following tasks:
. Your role is to return data strictly in JSON format without any additional text or commentary. Follow these rules:

1. Response Structure:
{
  "jswSteelQuote": {
    "amount": "[amount]",
    "productType": "[product type]"
  },
  "competitorQuote": {
    "amount": "[amount]",
    "productType": "[product type]"
  },
  "difference": {
    "amount": "[amount]",
    "savingsWith": "[cheaper company]",
    "costlierCompany": "[costlier company]",
    "percentageDifference": "[X]%"
  },
  "battleCards": [
    {
      "advantage": "[Advantage 1]",
      "businessImpact": "[Business Impact 1]"
    },
    {
      "advantage": "[Advantage 2]",
      "businessImpact": "[Business Impact 2]"
    }
  ]
}

2. Calculation Rules:
- Use JSW base prices:
  * TMT Bars: ₹58,000 per ton
  * HR Plates: ₹65,000 per ton
  * CR Plates: ₹72,000 per ton
- Apply competitor adjustments:
  * Tata Steel: +4% TMT, +3.5% HR, +5% CR
  * SAIL: -2% TMT, -1.5% HR, -3% CR
  * Essar Steel: +5% TMT, +4% HR, +6% CR
  * JSPL: +2% TMT, +3% HR, +1.5% CR

3. Number Rules:
- Always show prices in full (₹5,800,000 not 58L)
- Include percentage differences to 1 decimal place
- Show all savings/differences in exact amounts
- Include product type in parentheses (TMT/HR/CR)

Never deviate from this JSON format or include additional commentary.`;

    const userPrompt = `Analyze JSW Steel vs ${competitorName} for ${dataType} and return the data in the following JSON format:

{
  "priceComparison": {
    "jswSteelPrice": "[amount]",
    "competitorPrice": "[amount]",
    "percentageDifference": "[X]%"
  },
  "marketPosition": {
    "marketShare": "[current market share]",
    "regionalStrengths": "[regional strengths]",
    "distributionNetwork": "[distribution network comparison]",
    "manufacturingCapabilities": "[manufacturing capabilities]"
  },
  "productQuality": {
    "steelGradeComparisons": "[steel grade comparisons]",
    "qualityCertifications": "[quality certifications]",
    "productRangeAvailability": "[product range availability]",
    "technicalSpecifications": "[technical specifications]"
  },
  "deliveryLogistics": {
    "deliveryTimeframes": "[delivery timeframes]",
    "geographicCoverage": "[geographic coverage]",
    "warehouseLocations": "[warehouse locations]",
    "transportationCapabilities": "[transportation capabilities]"
  },
  "financialStability": {
    "creditTermsComparison": "[credit terms comparison]",
    "paymentFlexibility": "[payment flexibility]",
    "financialHealthIndicators": "[financial health indicators]",
    "riskAssessment": "[risk assessment]"
  },
  "competitiveAdvantages": {
    "environmentalCompliance": "[environmental compliance]",
    "technologyAdoption": "[technology adoption]",
    "rndCapabilities": "[R&D capabilities]",
    "customerServiceQuality": "[customer service quality]"
  },
  "strategicRecommendations": {
    "keyDifferentiators": "[key differentiators]",
    "riskMitigationStrategies": "[risk mitigation strategies]",
    "negotiationLeveragePoints": "[negotiation leverage points]",
    "longTermPartnershipBenefits": "[long-term partnership benefits]"
  }
}

Provide a structured analysis with specific data points and actionable insights. Focus on quantifiable metrics where possible and include real-world implications for business decisions.`;
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
- Integrated Logistics → JSW's regional hub network reduces costs`
  };
  return moats[competitorName] || 'Standard competitive advantages apply';
}

// Endpoint to analyze competitor
router.post('/analyze', async (req, res) => {
  try {
    const { competitorName, dataType } = req.body;

    if (!competitorName || !dataType) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both competitorName and dataType are required'
      });
    }

    const analysisString = await queryDeepSeek(competitorName, dataType);
    
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
