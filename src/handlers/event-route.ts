import { getClientIpAddress, getClientFbp, getClientFbc } from '../utils/request';
import { sendServerSideEvent } from '../services/server-side-events';
import { NextRequest, NextResponse } from 'next/server';

type Arguments = {
  eventName: string
  eventId: string
  emails?: Array<string> | null
  phones?: Array<string> | null
  firstName?: string
  lastName?: string
  country?: string
  city?: string
  zipCode?: string
  products: {
    sku: string
    quantity: number
  }[]
  value?: number
  currency?: string
  userAgent: string
  sourceUrl: string
  testEventCode?: string
};

/**
 * Facebook Conversion API Event Handler for Next.js 15.
 *
 * @param req
 * @constructor
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.FB_ACCESS_TOKEN) {
      throw new Error('Missing FB_ACCESS_TOKEN in environment file.');
    }

    if (!process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      throw new Error('Missing NEXT_PUBLIC_FB_PIXEL_ID in environment file.');
    }

    const body = await req.json() as Arguments;
    
    const {
      eventName,
      eventId,
      emails,
      phones,
      firstName,
      lastName,
      country,
      city,
      zipCode,
      products,
      value,
      currency,
      userAgent,
      sourceUrl,
      testEventCode,
    } = body;

    if (!eventName) {
      return NextResponse.json(
        { error: 'The request body is missing required parameters: eventName' },
        { status: 400 }
      );
    }

    const payload = {
      eventName,
      eventId,
      emails,
      phones,
      firstName,
      lastName,
      country,
      city,
      zipCode,
      products,
      value,
      currency,
      fbp: getClientFbp(req),
      fbc: getClientFbc(req),
      ipAddress: getClientIpAddress(req),
      userAgent,
      sourceUrl,
      testEventCode,
    };

    const response = await sendServerSideEvent(payload);

    const success = response?.events_received === 1 ?? false;

    if (process.env.NEXT_PUBLIC_FB_DEBUG === 'true') {
      return NextResponse.json({
        debug: true,
        success,
        payload,
        response,
      });
    }

    return NextResponse.json({
      success,
    });
  } catch (error) {
    console.error('Error processing Facebook Conversion API event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json(
    { message: 'This route only accepts POST requests' },
    { status: 405 }
  );
}
