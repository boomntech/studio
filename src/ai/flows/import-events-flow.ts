'use server';

/**
 * @fileOverview An AI flow to import events from Ticketmaster and save them to Firestore.
 *
 * - importEvents - A function that handles the event import process.
 * - ImportEventsInput - The input type for the importEvents function.
 * - ImportEventsOutput - The return type for the importEvents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { saveEventsBatch, type Event } from '@/services/eventService';

// Define the input and output schemas for the main flow
const ImportEventsInputSchema = z.object({
  query: z
    .string()
    .describe(
      'A natural language query for events to import, e.g., "rock concerts in san francisco"'
    ),
});
export type ImportEventsInput = z.infer<typeof ImportEventsInputSchema>;

const ImportEventsOutputSchema = z.object({
  importedCount: z
    .number()
    .describe('The number of events successfully imported.'),
  message: z.string().describe('A summary of the import operation.'),
});
export type ImportEventsOutput = z.infer<typeof ImportEventsOutputSchema>;

// Define the schema for the Ticketmaster search tool
const TicketmasterSearchInputSchema = z.object({
  keyword: z.string().optional().describe('The keyword to search for (e.g., "rock concert", "Maroon 5").'),
  city: z.string().optional().describe('The city to search for events in.'),
});

// Define the tool for searching events on Ticketmaster
const searchTicketmasterEvents = ai.defineTool(
  {
    name: 'searchTicketmasterEvents',
    description: 'Searches for public events using the Ticketmaster API.',
    inputSchema: TicketmasterSearchInputSchema,
    outputSchema: z.array(
      z.object({
        title: z.string(),
        date: z.string(),
        time: z.string().optional(),
        location: z.string(),
        image: z.string(),
        dataAiHint: z.string(),
        description: z.string(),
        ticketLink: z.string(),
      })
    ),
  },
  async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
    if (!apiKey) {
      throw new Error('Ticketmaster API key is not configured.');
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      size: '10', // Limit to 10 events per import
      sort: 'date,asc',
    });

    if (input.keyword) params.append('keyword', input.keyword);
    if (input.city) params.append('city', input.city);

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Ticketmaster API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data._embedded?.events) {
      return [];
    }

    // Map the Ticketmaster event format to our app's Event format
    return data._embedded.events.map((event: any): Omit<Event, 'id'> => {
        const bestImage = event.images?.find((img: any) => img.ratio === '16_9' && img.width > 600) || event.images?.[0];
        const venue = event._embedded?.venues?.[0];
        const classification = event.classifications?.[0];

        return {
            title: event.name,
            date: new Date(event.dates.start.localDate),
            time: event.dates.start.localTime,
            location: `${venue?.name || 'TBA'}, ${venue?.city?.name || ''}`,
            image: bestImage?.url || 'https://placehold.co/600x400.png',
            dataAiHint: `${classification?.segment?.name || ''} ${classification?.genre?.name || ''}`.trim(),
            description: event.info || event.pleaseNote || `Get ready for ${event.name}! An event you won't want to miss.`,
            ticketLink: event.url,
        };
    });
  }
);

// Define the main prompt that will use the tool
const importPrompt = ai.definePrompt({
  name: 'importEventsPrompt',
  system:
    'You are an event management assistant. Based on the user query, use the searchTicketmasterEvents tool to find relevant events. Do not make up events.',
  tools: [searchTicketmasterEvents],
  input: { schema: ImportEventsInputSchema },
});

// Define the main flow
const importEventsFlow = ai.defineFlow(
  {
    name: 'importEventsFlow',
    inputSchema: ImportEventsInputSchema,
    outputSchema: ImportEventsOutputSchema,
  },
  async (input) => {
    // Call the LLM with the prompt and tools
    const { output } = await importPrompt(input);

    const toolCalls = output.filter(part => part.toolRequest);
    if (toolCalls.length === 0) {
      return { importedCount: 0, message: 'I couldn\'t find any events matching your query.' };
    }

    // Since our prompt only has one tool, we can assume the first tool call is the one we want.
    const toolResponse = toolCalls[0].toolResponse;
    if (!toolResponse) {
       return { importedCount: 0, message: 'The AI tool failed to produce a result.' };
    }
    
    const eventsToSave = toolResponse as unknown as Omit<Event, 'id'>[];

    if (!eventsToSave || eventsToSave.length === 0) {
      return { importedCount: 0, message: 'No events were found to import.' };
    }

    // Save the events to Firestore
    await saveEventsBatch(eventsToSave);
    
    return {
      importedCount: eventsToSave.length,
      message: `Successfully imported ${eventsToSave.length} events.`,
    };
  }
);


/**
 * Public-facing wrapper function to call the Genkit flow.
 * @param input The user's query for events to import.
 * @returns A promise that resolves to the import result.
 */
export async function importEvents(
  input: ImportEventsInput
): Promise<ImportEventsOutput> {
  return importEventsFlow(input);
}
