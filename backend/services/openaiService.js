const OpenAI = require("openai");

let openaiClient;

const triageSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "urgency",
    "specialty",
    "summary",
    "riskAlerts",
    "recommendedActions",
    "hospitalRedirect",
    "followUpDays",
    "confidence",
  ],
  properties: {
    urgency: {
      type: "string",
      enum: ["emergency", "priority", "routine"],
    },
    specialty: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    riskAlerts: {
      type: "array",
      items: { type: "string" },
    },
    recommendedActions: {
      type: "array",
      items: { type: "string" },
    },
    hospitalRedirect: {
      type: "boolean",
    },
    followUpDays: {
      type: "number",
    },
    confidence: {
      type: "number",
    },
  },
};

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
};

const getAITriageAssessment = async (payload) => {
  const client = getClient();
  if (!client) {
    return null;
  }

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.2",
    reasoning: {
      effort: "low",
    },
    instructions:
      "You assist a telemedicine kiosk in India. You are not the final diagnosing clinician. Analyze symptoms, vitals, and patient history to support routing. Prioritize safety and escalate emergencies. Return concise structured JSON only.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(payload),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "telemedicine_triage",
        schema: triageSchema,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text);
};

module.exports = {
  getAITriageAssessment,
  getClient,
};
