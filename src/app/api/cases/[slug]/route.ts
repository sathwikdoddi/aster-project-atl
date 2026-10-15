import { caseRepository } from "@/lib/cases";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const record = await caseRepository.findBySlug((await params).slug);
    if (!record)
      return Response.json(
        {
          error: {
            code: "CASE_NOT_FOUND",
            message: "This story could not be found.",
          },
        },
        { status: 404 },
      );
    return Response.json({
      data: record,
      meta: { schemaVersion: "1.0", dataSource: "mock" },
    });
  } catch (error) {
    console.error("Unable to load case", error);
    return Response.json(
      {
        error: {
          code: "CASE_UNAVAILABLE",
          message: "This story is temporarily unavailable.",
        },
      },
      { status: 500 },
    );
  }
}
