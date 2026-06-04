import { ChatGroq } from "@langchain/groq";
import { createAgent, tool, createMiddleware } from "langchain";
import { SystemMessage, HumanMessage, RemoveMessage } from "@langchain/core/messages";
import * as z from "zod"
import { MemorySaver } from "@langchain/langgraph";
import {
    getLatestParcel as getLatestParcel_fxn,
    getParcelByStatus as getParcelByStatus_fxn,
    getParcelByName as getParcelByName_fxn,
    getMyParcels as getMyParcels_fxn,
    delayedParcels as delayedParcels_fxn,
    getParcelById as getParcelById_fxn,
    generateInvoice as generateInvoice_fxn,
    getParcelByCategory as getParcelByCategory_fxn,
    getLastNParcels as getLastNParcels_fxn,
    getParcelByServiceType as getParcelByServiceType_fxn
} from "../utils/llmfunctinos.js";

let userIdInside: string;

// ------------------------------------
// TOOLS
// ------------------------------------

export const getParcelByStatus = tool(
    async ({ status }) => {
        const res = await getParcelByStatus_fxn(status, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getParcelByStatus",
        description: `
Get parcels by shipment status.
Allowed values (must be exact, uppercase):
PLACED, IN_TRANSIT, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
Use when the user asks for parcels by status.
Convert natural language to one of the allowed values before calling.
Do NOT use for delayed/late queries (use delayedParcels instead).
    `,
        schema: z.object({
            status: z.string(),
        }),
    }
);

export const getParcelByName = tool(
    async ({ name }) => {
        const res = await getParcelByName_fxn(name, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getParcelByName",
        description: `
Get parcels by product name.
Use when the user mentions a product instead of a parcel ID.
Pass the exact name as given by the user:
- Do NOT modify, shorten, or normalize words
- Keep full phrases and spaces intact
If the input matches a valid parcel ID format, use getParcelById instead.
    `,
        schema: z.object({
            name: z.string(),
        }),
    }
);

export const getMyParcels = tool(
    async () => {
        // return await getMyParcels_fxn(userIdInside);
        console.log("inside the getMy parcel and user uid is", userIdInside)
        const res = await getMyParcels_fxn(userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getMyParcels",
        description: `
Get all parcels of the current user.
Use when the user asks for all their parcels or shipments.
Do NOT use if the user specifies filters like status, category, or name.
    `,
        schema: z.object({}),
    }
);

export const getParcelById = tool(
    async ({ parcelId }) => {
        const res = await getParcelById_fxn(parcelId, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getParcelById",
        description: `
Get parcel details using a parcel ID.
A valid parcelId must follow this format:
starts with "P-IDX" and is followed by exactly 7 characters.
Use this tool ONLY if the input strictly matches this format.
If the input does not match this pattern, use getParcelByName instead.
    `,
        schema: z.object({
            parcelId: z.string(),
        }),
    }
);

export const generateInvoice = tool(
    async ({ parcelId }) => {
        const res = await generateInvoice_fxn(parcelId, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "generateInvoice",
        description: `
Generate an invoice for a parcel.
Use when the user asks for invoice, bill, or receipt.
Input can be:
- A valid parcelId (starts with "P-IDX" + 7 characters)
Response format:
- The response MUST start with:
"Invoice Generation of <parcelId> has been successful."
- Replace <parcelId> with the actual parcel ID returned by the tool.
- Do not change this sentence structure.
Rules:
- Do NOT guess or alter the input
- Do NOT return JSON or raw tool output
- Convert the result into a clear, user-friendly response
    `,
        //         description: `
        // Generate an invoice for a parcel.
        // Use when the user asks for invoice, bill, or receipt.
        // Input can be:
        // - A valid parcelId (starts with "P-IDX" + 7 characters)
        // - OR an exact product name (do not modify input)
        // Do NOT guess or alter the input..
        //     `,
        schema: z.object({
            parcelId: z.string(),
        }),
    }
);

export const delayedParcels = tool(
    async () => {
        const res = await delayedParcels_fxn(userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "delayedParcels",
        description: `
Get all delayed parcels.
Use when the user asks about delayed, late, overdue,
or not delivered on time shipments.
Do NOT use getParcelByStatus for delay-related queries.
    `,
        schema: z.object({}),
    }
);

export const getLatestParcel = tool(
    async () => {
        const res = await getLatestParcel_fxn(userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getLatestParcel",
        description: `
Get the most recently created parcel.
Use when the user asks for latest, last, or most recent parcel.
Do NOT use if the user is asking for multiple or filtered parcels
    `,
        schema: z.object({}),
    }
);
export const getLatestNNoOfParcel = tool(
    async ({ n }) => {
        const res = await getLastNParcels_fxn(n, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getLatestNNoOfParcel",
        description: `
Get the most recent N parcels of the user.
Use when the user asks for latest, last few, or recent parcels with a specific number (e.g., last 3 parcels).
Do NOT use if the user does not specify a number or is asking for filtered parcels.
    `,
        schema: z.object({
            n: z.number().describe("Number of latest parcels to fetch"),
        }),
    }
);

export const getParcelByServiceType = tool(
    async ({ service_type }) => {
        const res = await getParcelByServiceType_fxn(service_type, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getParcelByServiceType",
        description: `
GGet parcels by service type.
Allowed values (must be exact, lowercase): standard Or express
Use when the user asks for parcels by delivery speed or type.
Convert user input into one of the allowed values before calling (e.g., fast → express, normal → standard).
Do NOT call if the service type cannot be clearly mapped.
    `,
        schema: z.object({
            service_type: z.string(),
        }),
    }
);
export const getParcelByCategory = tool(
    async ({ category }) => {
        const res = await getParcelByCategory_fxn(category, userIdInside);
        return JSON.stringify(res);
    },
    {
        name: "getParcelByCategory",
        description: `
Get parcels by category.
Allowed values (must be exact, lowercase):
electronics, clothing, documents, food, furniture, medical,
automotive, cosmetics, sports, books, fragile, industrial
Use when the user asks for parcels by category.
Convert user input into one of the allowed values before calling.
Do NOT call if the category cannot be clearly mapped.
    `,
        schema: z.object({
            category: z.string(),
        }),
    }
);

//////////////////////////////////////////////////////////////////////////////////////////////
// inti the model
const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "qwen/qwen3-32b",
});

//////////////////////////////////////////////////////////////////////////////////////////////
// prompt
const sys_prompt = new SystemMessage(`You are a helpful logistics assistant with access to tools.
Your job:
- Understand the user query
- Decide whether a tool is needed
- If needed, select and call the most appropriate tool
- Use the tool result to generate a clear, human-friendly response
Guidelines:
- Use tools ONLY when the query requires parcel or invoice data
- For greetings, casual conversation, or general questions, respond directly without using tools
- Choose the most specific tool available when needed
- Do not guess or invent any data
- Follow all tool input rules strictly
Response rules:
- Convert tool results into natural, user-friendly text
- Do NOT show JSON, tool calls, or internal reasoning
- Keep responses clear and concise
If no tool is appropriate:
- Respond conversationally or ask a clear follow-up question
- If required inputs are missing, ask the user instead of guessing`);

//////////////////////////////////////////////////////////////////////////////////////////////
// init the agent
const checkpointer = new MemorySaver();
// the llm will have a context of last 6 messages as well
const deleteOldMessages = createMiddleware({
    name: "DeleteOldMessages",
    afterModel: (state) => {
        const messages = state.messages;
        if (messages.length >= 7) {
            // remove the earliest four messages
            return {
                messages: messages
                    .slice(0, 3)
                    .map((m) => new RemoveMessage({ id: m.id! })),
            };
        }
        return;
    },
});

// agent
const agent = createAgent({
    model: model,
    tools: [getParcelByStatus, getParcelByName, getMyParcels,
        getParcelById, generateInvoice, delayedParcels, 
        getLatestParcel, getParcelByCategory,getLatestNNoOfParcel,getParcelByServiceType],
    systemPrompt: sys_prompt,
    middleware: [deleteOldMessages],
    checkpointer,
})

// jarvis
export function printLlmResponse(res: any) {
    const messages = res?.messages || [];
    for (const msg of messages) {
        const role = msg?.constructor?.name?.replace("Message", "") || "Unknown";

        console.log(`\n[${role}]`);

        if (msg?.content) {
            console.log(msg.content);
        }
        if (msg?.additional_kwargs && Object.keys(msg.additional_kwargs).length > 0) {
            console.log("KWARGS:", msg.additional_kwargs);
            console.log("-----------------------------------------------------")
        }
    }
}

export async function jarvis(userId: string, msg: string, id: number = 1) {
    userIdInside = userId;
    const llmRes = await agent.invoke(
        { messages: [new HumanMessage(msg)] },
        { configurable: { thread_id: String(userId) } }
    );
    printLlmResponse(llmRes);
    return llmRes;
}