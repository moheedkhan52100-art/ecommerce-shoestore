const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Please enter a message",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      instructions: `
        You are a helpful AI shopping assistant for a shoe e-commerce website.

        The store sells shoes for:
        - Men
        - Women
        - Kids
        - Jordan
        - Nike
        - SKIMS
        - Sport
        - Sportswear

        Help customers find shoes and answer questions
        about the store.

        Be friendly, concise, and helpful.
        Do not invent product information.
      `,
      input: message,
    });

    res.json({
      reply: response.output_text,
    });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      message: "Something went wrong with the AI chatbot.",
    });
  }
};

module.exports = {
  chatWithAI,
};