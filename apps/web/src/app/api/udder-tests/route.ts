import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get tenant_id from user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert rows for each quarter
    const quarters = ['LF', 'LR', 'RF', 'RR']
    const inserts = quarters.map(quarter => ({
      tenant_id: user.user_metadata.tenant_id,
      animal_id: body.animal_id,
      test_date: body.test_date,
      test_type: body.test_type || 'CMT',
      quarter: quarter,
      result_value: body[`${quarter.toLowerCase()}_scc`],
      result_text: body[`${quarter.toLowerCase()}_cmt`],
      pathogen: body[`${quarter.toLowerCase()}_pathogen`],
      notes: body.notes,
    })).filter(row => row.result_value != null || row.result_text != null || row.pathogen != null)

    const { data, error } = await supabase
      .from("udder_quarter_tests")
      .insert(inserts as any)
      .select()

    if (error) {
      console.error("Error creating udder test:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/udder-tests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
