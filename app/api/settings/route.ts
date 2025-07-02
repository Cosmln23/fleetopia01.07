// app/api/settings/route.ts
import { NextRequest } from 'next/server';
import { getSettings, updateSettings } from '@/lib/serverSettings';

export async function GET() {
  return Response.json(getSettings());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  updateSettings(body);          // {autoAssign:true/false, agentOn:true/false}
  return Response.json(getSettings());
}