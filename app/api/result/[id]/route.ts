import { getResult } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) return Response.json({ error: "לא נמצא" }, { status: 404 });
  return Response.json(result);
}
