import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PublishingError } from "@aster/publishing/model";

export function reply(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function replyError(error: unknown) {
  if (error instanceof PublishingError)
    return reply({ error: error.message }, error.status);
  if (error instanceof ZodError || error instanceof SyntaxError)
    return reply({ error: "Check the form values and try again." }, 400);
  return reply(
    {
      error:
        "This action could not be completed. The existing published version has been preserved.",
    },
    500,
  );
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new PublishingError("Send this request as JSON.", 415);
  const text = await request.text();
  if (text.length > 80_000)
    throw new PublishingError("This form is too large.", 413);
  return JSON.parse(text);
}
