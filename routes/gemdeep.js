const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();

// Endpoint to process data through multiple AI models
router.post('/process', async (req, res) => {
  try {
    const { dataType } = req.body;
    
    if (!dataType) {
      return res.status(400).json({ error: 'Please provide the data type required' });
    }

    console.log(`Processing request for data type: ${dataType}`);

    // Step 1: Query Gemini for information
    const geminiResponse = await queryGemini(dataType);
    console.log('Received response from Gemini');

    // Step 2: Query Perplexity for information
    const perplexityResponse = await queryPerplexity(dataType);
    console.log('Received response from Perplexity');

    // Step 3: Combine both outputs
    const combinedContent = `
      # Information from Gemini:
      ${geminiResponse}

      # Information from Perplexity:
      ${perplexityResponse}
    `;
    console.log('Combined responses from both models');

    // Step 4: Use DeepSeek to extract relevant information
    const extractedData = await extractWithDeepSeek(dataType, combinedContent);
    console.log('Extracted relevant information with DeepSeek');

    // Return the results
    res.json({
      success: true,
      dataType: dataType,
      sources: {
        gemini: geminiResponse,
        perplexity: perplexityResponse
      },
      extractedData: extractedData
    });

  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ 
      error: 'Failed to process data', 
      details: error.message 
    });
  }
});

// Function to query Google's Gemini model
async function queryGemini(dataType) {
  try {
    // Format the prompt for Gemini
    const prompt = `Please provide comprehensive information about ${dataType}. Include key aspects, definitions, examples, and best practices.`;
    
    // Initialize the Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    
    // Extract and return the text response
    return result.response.text();
  } catch (error) {
    console.error('Error querying Gemini:', error);
    return `Error getting information from Gemini: ${error.message}`;
  }
}

// Function to query Perplexity AI
async function queryPerplexity(dataType) {
  try {
    // Format the prompt for Perplexity
    const prompt = `Please provide detailed information about ${dataType}. I need comprehensive coverage including key concepts, practical applications, and industry insights.`;
    
    // Make request to Perplexity API
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate and detailed information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
        }
      }
    );
    
    // Extract and return the text response
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying Perplexity:', error);
    return `Error getting information from Perplexity: ${error.message}`;
  }
}

// Function to extract relevant information using DeepSeek
async function extractWithDeepSeek(dataType, combinedContent) {
  try {
    // Format the prompt for DeepSeek
    const extractionPrompt = `I have information about ${dataType} from multiple sources. Please analyze the following content and extract the most relevant, accurate, and comprehensive information. Present it in a well-structured format with clear sections and bullet points where appropriate.
Content to analyze:
${combinedContent}`;

    
    // Make request to DeepSeek via Groq API
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "deepseek-r1-distill-qwen-32b",
        messages: [
          {
            role: "system",
            content: "You are a data extraction and synthesis expert. Your job is to extract the most relevant information, resolve any contradictions between sources, and present a clear, comprehensive summary."
          },
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract and return the text response
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error extracting with DeepSeek:', error);
    return `Error extracting information with DeepSeek: ${error.message}`;
  }
}

module.exports = router;
