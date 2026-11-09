import { publicCaseRepository, publicDataSource } from "@/server/public-cases";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cases = await publicCaseRepository.list();
    return Response.json({
      data: cases,
      meta: {
        count: cases.length,
        schemaVersion: "1.1",
        dataSource: publicDataSource,
      },
    });
  } catch (error) {
    console.error("Unable to load case collection", error);
    return Response.json(
      {
        error: {
          code: "CASES_UNAVAILABLE",
          message: "Stories are temporarily unavailable.",
        },
      },
      { status: 500 },
    );
  }
}
