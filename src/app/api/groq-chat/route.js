import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request) {
  try {
    const { message } = await request.json()

    // Check if GROQ_API_KEY is available
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'GROQ_API_KEY is not configured. Please add it to your .env.local file.'
      }, { status: 500 })
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: apiKey,
    })

    // Create chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Lakshmi AI, a helpful financial assistant specializing in stock market analysis and investment guidance. You provide:

1. Stock price information and analysis
2. Company financial insights
3. Market trends and predictions
4. Investment recommendations with risk assessments

Guidelines:
- Always include risk disclaimers
- Focus on factual, data-driven insights
- Suggest both pros and cons for investments
- Recommend consulting financial advisors for major decisions
- Keep responses concise but informative
- Use emojis sparingly for better readability

When users ask about specific stocks, provide analysis covering:
- Current market position
- Recent performance trends
- Key financial metrics
- Potential risks and opportunities
- Investment time horizon considerations`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama3-8b-8192", // Using Llama 3 model
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    })

    const response = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      response: response
    })

  } catch (error) {
    console.error('Groq API Error:', error)
    
    // Handle specific error types
    if (error.status === 401) {
      return NextResponse.json({
        error: 'Invalid GROQ_API_KEY. Please check your API key in .env.local file.'
      }, { status: 401 })
    }
    
    if (error.status === 429) {
      return NextResponse.json({
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 })
    }

    return NextResponse.json({
      error: `API Error: ${error.message || 'Failed to process request'}`
    }, { status: 500 })
  }
}
