import { publicCaseRepository, publicDataSource } from "@/server/public-cases";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const record = await publicCaseRepository.findBySlug((await params).slug);
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
      meta: { schemaVersion: "1.1", dataSource: publicDataSource },
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
