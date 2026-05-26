import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
    const tag = request.nextUrl.searchParams.get('tag');
    
    if (!tag) {
        return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
    }

    // @ts-expect-error - Next.js internal / extended signature in this project expects 2 args
    revalidateTag(tag, 'max');
    return NextResponse.json({ revalidated: true, now: Date.now(), tag });
}
