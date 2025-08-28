import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

// init Gemini
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

const model = google("models/gemini-2.0-flash");

// ----- TRIAGE ROUTER -----
async function triageRouter(emailInput: {
    author: string;
    to: string;
    subject: string;
    email_thread: string;
}) {
    const { author, to, subject, email_thread } = emailInput;

    const systemPrompt = `
You are an email triage assistant.
Decide if an email should be: 
- RESPOND (requires a reply)
- IGNORE (safe to skip)
- NOTIFY (important but no response needed)

Background: The user wants to handle emails efficiently.
`;

    const userPrompt = `
Author: ${author}
To: ${to}
Subject: ${subject}
Thread: ${email_thread}

Classify this email.
`;

    const response = await streamText({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    const { text } = await response;

    const normalized = (await text).toLowerCase();

    if (normalized.includes("ignore")) return "ignore";
    if (normalized.includes("notify")) return "notify";
    return "respond"; // default
}

// ----- RESPONSE AGENT -----
async function responseAgent(emailInput: {
    author: string;
    to: string;
    subject: string;
    email_thread: string;
}) {
    const prompt = `
You are an AI email assistant. Write a polite, clear, and professional reply
based on this email thread.

Subject: ${emailInput.subject}
From: ${emailInput.author}
To: ${emailInput.to}
Thread:
${emailInput.email_thread}
`;

    const response = await streamText({
        model,
        messages: [{ role: "user", content: prompt }],
    });

    return response.toTextStreamResponse();
}

// ----- API ROUTE -----
export async function POST(req: Request) {
    const body = await req.json();

    const classification = await triageRouter(body.email_input);

    if (classification === "respond") {
        console.log("📧 Classification: RESPOND - generating reply");
        return responseAgent(body.email_input);
    } else if (classification === "ignore") {
        console.log("🚫 Classification: IGNORE");
        return NextResponse.json({
            classification,
            message: "This email can be ignored.",
        });
    } else if (classification === "notify") {
        console.log("🔔 Classification: NOTIFY");
        return NextResponse.json({
            classification,
            message: "This email contains important info.",
        });
    }

    return NextResponse.json({ classification: "unknown" });
}
