import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userInput, analysisType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let messages;

    if (analysisType === "facial") {
      // Analyze mood from facial image
      messages = [
        {
          role: "system",
          content: `You are an empathetic AI wellness assistant specializing in emotional analysis. 
          Analyze the facial expression in the image and determine the person's likely emotional state.
          Respond with ONLY a JSON object in this exact format:
          {
            "mood": "happy" | "calm" | "tired" | "anxious" | "neutral" | "sad" | "energetic",
            "confidence": 0-100,
            "insight": "A brief, supportive observation about their emotional state",
            "suggestion": "A helpful wellness tip based on their mood"
          }
          Be compassionate and encouraging in your insights.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze this person's facial expression and determine their emotional state." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ];
    } else if (analysisType === "journal") {
      // Analyze mood from journal entry
      messages = [
        {
          role: "system",
          content: `You are an empathetic AI wellness assistant. Analyze the user's journal entry and provide emotional insights.
          Respond with ONLY a JSON object in this exact format:
          {
            "mood": "happy" | "calm" | "tired" | "anxious" | "neutral" | "sad" | "energetic",
            "sentiment": "positive" | "neutral" | "negative",
            "emotions": ["array of detected emotions"],
            "insight": "A thoughtful observation about their feelings",
            "affirmation": "A personalized positive affirmation",
            "suggestion": "A wellness activity recommendation"
          }`
        },
        { role: "user", content: userInput }
      ];
    } else if (analysisType === "chat") {
      // AI wellness chat
      messages = [
        {
          role: "system",
          content: `You are MindPal, a warm and supportive AI wellness companion. You help users with:
          - Emotional support and validation
          - Mindfulness and breathing exercises
          - Cognitive reframing of negative thoughts
          - Stress management techniques
          - Sleep hygiene tips
          - General wellness advice
          
          Be empathetic, encouraging, and practical. Keep responses concise but meaningful.
          Use gentle language and occasional emojis to feel warm and approachable.`
        },
        { role: "user", content: userInput }
      ];
    } else {
      throw new Error("Invalid analysis type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Try to parse JSON from the response
    let result;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { response: content };
      }
    } catch {
      result = { response: content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Mood analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});